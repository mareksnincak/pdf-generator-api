import { randomUUID } from 'node:crypto';

import type { APIGatewayProxyWithCognitoAuthorizerEvent } from 'aws-lambda';

import { getEnvVariableOrFail } from '../../helpers/env.helper';
import { ErrorFormat } from '../../helpers/error.helper';
import { getUserIdFromEventOrFail } from '../../helpers/event.helper';
import { wrapHandler } from '../../helpers/handler.helper';
import { logger } from '../../helpers/logger.helper';
import { getPresignedShareUrl, putObject } from '../../helpers/s3.helper';
import { validateBody } from '../../helpers/validation.helper';
import { scheduleObjectDeletion } from '../delete-expired-s3-objects/helpers/schedule-deletion.helper';

import { generateDocumentFromApiEventRequestDto } from './dtos/api-request.dto';
import { type GenerateDocumentFromApiEventResponseDto } from './dtos/api-response.dto';
import { generateDocument } from './services/document-generation.service';

async function getShareableUrl({
  bucket,
  data,
  keyPrefix,
}: {
  bucket: string;
  data: Uint8Array;
  keyPrefix: string;
}) {
  const expiresInSeconds = Number(getEnvVariableOrFail('PRESIGNED_URL_EXPIRATION_SECONDS'));

  const key = `${keyPrefix}/${randomUUID()}.pdf`;

  const [url] = await Promise.all([
    getPresignedShareUrl({ bucket, expiresInSeconds, key }),
    putObject({
      bucket,
      data,
      key,
    }),
    scheduleObjectDeletion({
      /**
       * We are adding 30s as a safety buffer to make sure
       * object isn't deleted before presigned url expires.
       */
      deleteInSeconds: expiresInSeconds + 30,
      key,
    }),
  ]);

  return url;
}

async function handler(event: APIGatewayProxyWithCognitoAuthorizerEvent) {
  logger.info('generateDocumentFromApiEvent.starting');

  const validatedData = validateBody(event, generateDocumentFromApiEventRequestDto);
  logger.info(validatedData, 'generateDocumentFromApiEvent.validatedData');

  const { data, templateId } = validatedData;

  const userId = getUserIdFromEventOrFail(event);
  const bucket = getEnvVariableOrFail('S3_BUCKET');

  const pdf = await generateDocument({
    data,
    templateId,
    userId,
  });

  const url = await getShareableUrl({
    bucket,
    data: pdf,
    keyPrefix: `documents/${userId}`,
  });

  const response: GenerateDocumentFromApiEventResponseDto = {
    url,
  };
  logger.info('generateDocumentFromApiEvent.success');
  return {
    body: JSON.stringify(response),
    statusCode: 200,
  };
}

export const generateDocumentFromApiEvent = wrapHandler(handler, {
  errorFormat: ErrorFormat.API,
  logPrefix: 'generateDocumentFromApiEvent',
});
