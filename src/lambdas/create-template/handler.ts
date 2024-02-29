import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { logger, setLoggerContext } from '../../helpers/logger.helper';
import { createOrReplace } from '../../db/template/template.repository';
import { S3ServiceException } from '@aws-sdk/client-s3';
import { S3ExceptionName } from '../../enums/s3.enum';
import { createTemplateRequestDto } from './dtos/request.dto';
import { type CreateTemplateResponseDto } from './dtos/response.dto';
import { handleError } from '../../helpers/error.helper';
import { validateBody } from '../../helpers/validation.helper';
import { NotFoundError } from '../../errors/not-found.error';
import { ErrorMessage } from '../../enums/error.enum';
import { moveObject } from '../../helpers/s3.helper';

async function moveTemplateDataToPermanentLocation(uploadId: string) {
  try {
    // TODO validate html
    const bucket = process.env.S3_BUCKET;

    if (!bucket) {
      throw new Error('createTemplate.moveTemplateDataToPermanentLocation.missingS3Bucket');
    }

    const uploadedDataS3Key = `templates/uploads/${uploadId}`;
    const storedDataS3Key = `/templates/data/${uploadId}`;

    await moveObject({
      sourceBucket: bucket,
      sourceKey: uploadedDataS3Key,
      destinationBucket: bucket,
      destinationKey: storedDataS3Key,
    });

    return storedDataS3Key;
  } catch (error) {
    if (error instanceof S3ServiceException && error.name === S3ExceptionName.noSuchKey) {
      throw new NotFoundError({
        message: ErrorMessage.templateDataNotFound,
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
      id: template.id,
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
