import { randomUUID } from 'node:crypto';

import type {
  APIGatewayProxyResult,
  APIGatewayProxyWithCognitoAuthorizerEvent,
  Context,
} from 'aws-lambda';

import { getEnvVariableOrFail } from '../../helpers/env.helper';
import { handleApiError } from '../../helpers/error.helper';
import { getUserIdFromEventOrFail } from '../../helpers/event.helper';
import { logger, setLoggerContext } from '../../helpers/logger.helper';
import { getPresignedShareUrl, putObject } from '../../helpers/s3.helper';
import { sendSqsMessage } from '../../helpers/sqs.helper';
import { validateBody } from '../../helpers/validation.helper';

import { generateDocumentFromApiEventRequestDto } from './dtos/api-request.dto';
import { type GenerateDocumentFromApiEventResponseDto } from './dtos/api-response.dto';
import { generateDocument } from './services/document-generation.service';

async function scheduleObjectDeletion({
  key,
  deleteInSeconds,
}: {
  key: string;
  deleteInSeconds?: number;
}) {
  const queueUrl = getEnvVariableOrFail('DELETE_EXPIRED_S3_OBJECTS_QUEUE_URL');
  await sendSqsMessage({
    queueUrl,
    body: key,
    delaySeconds: deleteInSeconds,
  });
}

async function getShareableUrl({
  bucket,
  keyPrefix,
  data,
}: {
  bucket: string;
  keyPrefix: string;
  data: Buffer;
}) {
  const expiresInSeconds = Number(getEnvVariableOrFail('PRESIGNED_URL_EXPIRATION_SECONDS'));

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

export async function generateDocumentFromApiEvent(
  event: APIGatewayProxyWithCognitoAuthorizerEvent,
  context: Context,
): Promise<APIGatewayProxyResult> {
  try {
    setLoggerContext(event, context);
    logger.info('generateDocumentFromApiEvent.starting');

    const validatedData = validateBody(event, generateDocumentFromApiEventRequestDto);
    logger.info(validatedData, 'generateDocumentFromApiEvent.validatedData');

    const { templateId, data } = validatedData;

    const userId = getUserIdFromEventOrFail(event);
    const bucket = getEnvVariableOrFail('S3_BUCKET');

    const pdf = await generateDocument({
      userId,
      templateId,
      data,
    });

    const url = await getShareableUrl({
      bucket,
      keyPrefix: `${userId}/documents`,
      data: pdf,
    });

    const response: GenerateDocumentFromApiEventResponseDto = {
      url,
    };
    logger.info('generateDocumentFromApiEvent.success');
    return {
      body: JSON.stringify(response),
      statusCode: 200,
    };
  } catch (error) {
    return handleApiError({ error, logPrefix: 'generateDocumentFromApiEvent' });
  }
}
