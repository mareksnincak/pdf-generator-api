import { randomUUID } from 'node:crypto';

import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type {
  APIGatewayProxyResult,
  APIGatewayProxyWithCognitoAuthorizerEvent,
  Context,
} from 'aws-lambda';

import { handleError } from '../../helpers/error.helper';
import { getUserIdFromEventOrFail } from '../../helpers/event.helper';
import { logger, setLoggerContext } from '../../helpers/logger.helper';
import { getS3Client } from '../../helpers/s3.helper';
import { validateQueryParams } from '../../helpers/validation.helper';

import { getUrlForTemplateUploadRequestDto } from './dtos/request.dto';
import { type GetUrlForTemplateUploadResponseDto } from './dtos/response.dto';

async function createPresignedUrl({
  fileSizeBytes,
  userId,
}: {
  fileSizeBytes: number;
  userId: string;
}) {
  const uploadId = randomUUID();

  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: `${userId}/templates/uploads/${uploadId}`,
    ContentLength: fileSizeBytes,
  });

  const s3Client = getS3Client();

  const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
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
    return handleError({ error, logPrefix: 'getUrlForTemplateUpload' });
  }
}
