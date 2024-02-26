import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { logger, setLoggerContext } from '../../helpers/logger.helper';
import { createOrReplace } from '../../db/template/template.repository';
import { type TemplateType } from '../../db/template/template.enum';
import {
  CopyObjectCommand,
  DeleteObjectCommand,
  S3Client,
  S3ServiceException,
} from '@aws-sdk/client-s3';
import { S3ExceptionName } from '../../enums/s3.enum';

const s3Client = new S3Client();

async function moveTemplateDataToPermanentLocation(uploadId: string) {
  // TODO validate html
  const bucket = process.env.S3_BUCKET;
  const uploadedDataS3Key = `templates/uploads/${uploadId}`;
  const storedDataS3Key = `/templates/data/${uploadId}`;

  await s3Client.send(
    new CopyObjectCommand({
      CopySource: `${bucket}/${uploadedDataS3Key}`,
      Bucket: bucket,
      Key: storedDataS3Key,
    }),
  );

  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: uploadedDataS3Key,
    }),
  );

  return storedDataS3Key;
}

export async function createTemplate(
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<APIGatewayProxyResult> {
  try {
    setLoggerContext(event, context);
    logger.info('createTemplate.starting');

    // TODO proper validation
    const { id, name, uploadId, type } = JSON.parse(event.body ?? '') as {
      id?: string;
      name: string;
      uploadId: string;
      type: TemplateType;
    };

    const s3Key = await moveTemplateDataToPermanentLocation(uploadId);
    const template = await createOrReplace({ id, name, type, s3Key });

    const response = {
      templateId: template.id,
    };
    logger.info({ response }, 'createTemplate.response');
    return {
      body: JSON.stringify(response),
      statusCode: 200,
    };
  } catch (error) {
    // TODO cleanup error handling
    if (error instanceof S3ServiceException && error.name === S3ExceptionName.noSuchKey) {
      return {
        body: JSON.stringify({ message: 'Template data not found' }),
        statusCode: 404,
      };
    }

    throw error;
  }
}
