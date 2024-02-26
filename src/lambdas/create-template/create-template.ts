import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { logger, setLoggerContext } from '../../helpers/logger.helper';
import { createOrReplace } from '../../db/template/template.repository';
import {
  CopyObjectCommand,
  DeleteObjectCommand,
  S3Client,
  S3ServiceException,
} from '@aws-sdk/client-s3';
import { S3ExceptionName } from '../../enums/s3.enum';
import { createTemplateRequestDto } from './dtos/create-template-request.dto';
import { type CreateTemplateResponseDto } from './dtos/create-template-response.dto';
import { handleError } from '../../helpers/error.helper';
import { validateBody } from '../../helpers/validation.helper';
import { NotFoundError } from '../../errors/not-found.error';

const s3Client = new S3Client();

async function moveTemplateDataToPermanentLocation(uploadId: string) {
  try {
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
  } catch (error) {
    if (error instanceof S3ServiceException && error.name === S3ExceptionName.noSuchKey) {
      throw new NotFoundError({
        message: 'Template data not found',
      });
    }

    throw error;
  }
}

export async function createTemplate(
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<APIGatewayProxyResult> {
  try {
    setLoggerContext(event, context);
    logger.info('createTemplate.starting');

    const validatedData = validateBody(event, createTemplateRequestDto);
    logger.info(validatedData, 'createTemplate.validatedData');

    const { id, name, uploadId, type } = validatedData;

    const s3Key = await moveTemplateDataToPermanentLocation(uploadId);
    const template = await createOrReplace({ id, name, type, s3Key });

    const response: CreateTemplateResponseDto = {
      templateId: template.id,
    };
    logger.info(response, 'createTemplate.response');
    return {
      body: JSON.stringify(response),
      statusCode: 200,
    };
  } catch (error) {
    return handleError({ error, logPrefix: 'createTemplate' });
  }
}
