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
import { sendSqsMessage } from '../../helpers/sqs.helper';
import { validateBody } from '../../helpers/validation.helper';

import { generateDocumentRequestDto } from './dtos/request.dto';
import { type GenerateDocumentResponseDto } from './dtos/response.dto';
import { transformPdfToHtml } from './transformers/pdf.transformer';

async function renderHtmlTemplate(template: TemplateEntity, data: Record<string, unknown>) {
  logger.info('generateDocument.renderHtmlTemplate.start');

  const templateData = await template.getData();
  const compiledTemplate = compile(templateData.toString());
  const renderedTemplate = compiledTemplate(data);

  logger.info('generateDocument.renderHtmlTemplate.success');
  return renderedTemplate;
}

async function scheduleObjectDeletion({
  key,
  deleteInSeconds,
}: {
  key: string;
  deleteInSeconds?: number;
}) {
  const queueUrl = process.env.DELETE_EXPIRED_S3_OBJECTS_QUEUE_URL;
  if (!queueUrl) {
    throw new Error('generateDocument.scheduleObjectDeletion.missingQueueUrl');
  }

  await sendSqsMessage({
    queueUrl,
    body: key,
    delaySeconds: deleteInSeconds,
  });
}

export async function getShareableUrl({
  bucket,
  keyPrefix,
  data,
}: {
  bucket: string;
  keyPrefix: string;
  data: Buffer;
}) {
  const expiresInSeconds = 60;

  const key = `${keyPrefix}/${randomUUID()}.pdf`;

  const [url] = await Promise.all([
    getPresignedShareUrl({ bucket, key, expiresInSeconds }),
    putObject({
      bucket,
      key,
      data,
    }),
    scheduleObjectDeletion({
      key,
      /**
       * We are adding 30s as a safety buffer to make sure
       * object isn't deleted before presigned url expires.
       */
      deleteInSeconds: expiresInSeconds + 30,
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
