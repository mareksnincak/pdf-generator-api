import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { logger, setLoggerContext } from '../../helpers/logger.helper';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

const s3Client = new S3Client();

async function createPresignedUrl({
  fileSizeBytes,
  uploadId,
}: {
  fileSizeBytes: number;
  uploadId: string;
}) {
  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: `templates/uploads/${uploadId}`,
    ContentLength: fileSizeBytes,
  });

  const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  return url;
}

export async function getUrlForTemplateUpload(
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<APIGatewayProxyResult> {
  setLoggerContext(event, context);
  logger.info('getUrlForTemplateUpload.starting');

  // TODO proper validation
  const fileSizeBytes = Number(event.queryStringParameters?.fileSizeBytes);
  if (!fileSizeBytes || isNaN(fileSizeBytes)) {
    return {
      body: JSON.stringify({
        message: 'Validation failed',
      }),
      statusCode: 400,
    };
  }

  const uploadId = randomUUID();
  const url = await createPresignedUrl({ fileSizeBytes, uploadId });

  const response = {
    uploadId,
    url,
  };
  logger.info({ response }, 'getUrlForTemplateUpload.response');
  return {
    body: JSON.stringify(response),
    statusCode: 200,
  };
}
