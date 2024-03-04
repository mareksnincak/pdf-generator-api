import { randomUUID } from 'node:crypto';

import type {
  APIGatewayProxyResult,
  APIGatewayProxyWithCognitoAuthorizerEvent,
  Context,
} from 'aws-lambda';
import { compile } from 'handlebars';

import { type TemplateEntity } from '../../db/template/template.entity';
import { getByIdOrFail } from '../../db/template/template.repository';
import { handleError } from '../../helpers/error.helper';
import { getUserIdFromEventOrFail } from '../../helpers/event.helper';
import { logger, setLoggerContext } from '../../helpers/logger.helper';
import { getPresignedShareUrl, putObject } from '../../helpers/s3.helper';
import { validateBody } from '../../helpers/validation.helper';

import { generateDocumentRequestDto } from './dtos/request.dto';
import { type GenerateDocumentResponseDto } from './dtos/response.dto';

async function renderHtmlTemplate(template: TemplateEntity, data: Record<string, unknown>) {
  const templateData = await template.getData();
  const compiledTemplate = compile(templateData.toString());
  const renderedTemplate = compiledTemplate(data);

  return renderedTemplate;
}

async function transformPdfToHtml(html: string) {
  return await Promise.resolve(Buffer.from(html));
}

export async function getShareableUrl({
  bucket,
  keyPrefix,
  data,
  expiresInSeconds = 3600,
}: {
  bucket: string;
  keyPrefix: string;
  data: Buffer;
  expiresInSeconds?: number;
}) {
  const bufferSeconds = 60;
  // TODO move to date helper
  const expiresAt = new Date();
  expiresAt.setSeconds(expiresAt.getSeconds() + expiresInSeconds + bufferSeconds);

  const key = `${keyPrefix}/${randomUUID()}`;

  const [url] = await Promise.all([
    getPresignedShareUrl({ bucket, key, expiresInSeconds }),
    // TODO schedule lambda to delete file
    putObject({
      bucket,
      key,
      data,
    }),
  ]);

  return url;
}

export async function generateDocument(
  event: APIGatewayProxyWithCognitoAuthorizerEvent,
  context: Context,
): Promise<APIGatewayProxyResult> {
  try {
    setLoggerContext(event, context);
    logger.info('generateDocument.starting');

    const validatedData = validateBody(event, generateDocumentRequestDto);
    logger.info(validatedData, 'generateDocument.validatedData');

    const { templateId, data } = validatedData;

    const bucket = process.env.S3_BUCKET;
    if (!bucket) {
      throw new Error('generateDocument.addDataToTemplate.missingBucket');
    }

    const userId = getUserIdFromEventOrFail(event);
    const template = await getByIdOrFail({ id: templateId, userId });
    const renderedTemplate = await renderHtmlTemplate(template, data);
    const pdf = await transformPdfToHtml(renderedTemplate);
    const url = await getShareableUrl({
      bucket,
      keyPrefix: `${userId}/documents`,
      data: pdf,
    });

    const response: GenerateDocumentResponseDto = {
      url,
    };
    logger.info('generateDocument.success');
    return {
      body: JSON.stringify(response),
      statusCode: 200,
    };
  } catch (error) {
    return handleError({ error, logPrefix: 'createTemplate' });
  }
}
