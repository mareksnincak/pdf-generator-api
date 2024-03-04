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
import { getObject } from '../../helpers/s3.helper';
import { validateBody } from '../../helpers/validation.helper';

import { generateDocumentRequestDto } from './dtos/request.dto';
import { type GenerateDocumentResponseDto } from './dtos/response.dto';

async function renderTemplate(template: TemplateEntity, data: Record<string, unknown>) {
  const bucket = process.env.S3_BUCKET;
  if (!bucket) {
    throw new Error('generateDocument.addDataToTemplate.missingBucket');
  }

  const { data: binaryTemplateData } = await getObject({
    bucket,
    key: template.s3Key,
  });

  const templateData = await binaryTemplateData?.transformToString();
  const compiledTemplate = compile(templateData);
  const renderedTemplate = compiledTemplate(data);

  return renderedTemplate;
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
    const userId = getUserIdFromEventOrFail(event);
    const template = await getByIdOrFail({ id: templateId, userId });
    const renderedTemplate = await renderTemplate(template, data);

    const response: GenerateDocumentResponseDto = {
      url: renderedTemplate,
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
