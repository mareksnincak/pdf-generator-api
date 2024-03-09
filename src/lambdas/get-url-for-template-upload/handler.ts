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
import { getPresignedUploadUrl } from '../../helpers/s3.helper';
import { validateQueryParams } from '../../helpers/validation.helper';
import { scheduleObjectDeletion } from '../delete-expired-s3-objects/helpers/schedule-deletion.helper';

import { getUrlForTemplateUploadRequestDto } from './dtos/request.dto';
import { type GetUrlForTemplateUploadResponseDto } from './dtos/response.dto';

async function createPresignedUrl({
  fileSizeBytes,
  userId,
}: {
  fileSizeBytes: number;
  userId: string;
}) {
  const expiresInSeconds = Number(getEnvVariableOrFail('PRESIGNED_URL_EXPIRATION_SECONDS'));
  const deleteInSeconds = Number(getEnvVariableOrFail('DELETE_UPLOADED_OBJECT_IN_SECONDS'));
  const bucket = getEnvVariableOrFail('S3_BUCKET');
  const uploadId = randomUUID();

  const key = `${userId}/templates/uploads/${uploadId}`;
  const [url] = await Promise.all([
    getPresignedUploadUrl({
      bucket,
      key,
      fileSizeBytes,
      expiresInSeconds,
    }),
    scheduleObjectDeletion({
      key,
      deleteInSeconds,
    }),
  ]);

  return { url, uploadId };
}

export async function getUrlForTemplateUpload(
  event: APIGatewayProxyWithCognitoAuthorizerEvent,
  context: Context,
): Promise<APIGatewayProxyResult> {
  try {
    setLoggerContext(event, context);
    logger.info('getUrlForTemplateUpload.starting');

    const validatedQueryParams = validateQueryParams(event, getUrlForTemplateUploadRequestDto);
    logger.info(validatedQueryParams, 'getUrlForTemplateUpload.validatedQueryParams');

    const { fileSizeBytes } = validatedQueryParams;

    const userId = getUserIdFromEventOrFail(event);
    const { url, uploadId } = await createPresignedUrl({ fileSizeBytes, userId });

    const response: GetUrlForTemplateUploadResponseDto = {
      uploadId,
      url,
    };
    logger.info(response, 'getUrlForTemplateUpload.response');
    return {
      body: JSON.stringify(response),
      statusCode: 200,
    };
  } catch (error) {
    return handleApiError({ error, logPrefix: 'getUrlForTemplateUpload' });
  }
}
