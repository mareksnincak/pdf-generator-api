import { randomUUID } from 'node:crypto';

import { S3ServiceException } from '@aws-sdk/client-s3';
import type {
  APIGatewayProxyResult,
  APIGatewayProxyWithCognitoAuthorizerEvent,
  Context,
} from 'aws-lambda';

import * as templateRepository from '../../db/template/repository';
import { ErrorMessage } from '../../enums/error.enum';
import { S3ExceptionName } from '../../enums/s3.enum';
import { NotFoundError } from '../../errors/not-found.error';
import { getEnvVariableOrFail } from '../../helpers/env.helper';
import { handleApiError } from '../../helpers/error.helper';
import { getUserIdFromEventOrFail } from '../../helpers/event.helper';
import { logger, setLoggerContext } from '../../helpers/logger.helper';
import { deleteObject, moveObject } from '../../helpers/s3.helper';
import { validateBody } from '../../helpers/validation.helper';

import { type CreateTemplateRequestDto, createTemplateRequestDto } from './dtos/request.dto';
import { type CreateTemplateResponseDto } from './dtos/response.dto';

async function moveTemplateDataToPermanentLocation({
  bucket,
  uploadId,
  userId,
}: {
  bucket: string;
  uploadId: string;
  userId: string;
}) {
  try {
    // TODO validate html
    const uploadedDataS3Key = `${userId}/templates/uploads/${uploadId}`;
    const storedDataS3Key = `${userId}/templates/data/${randomUUID()}`;

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

export async function createTemplateWithData({
  userId,
  requestData: { id, name, uploadId, type },
}: {
  userId: string;
  requestData: CreateTemplateRequestDto;
}) {
  const bucket = getEnvVariableOrFail('S3_BUCKET');

  const s3Key = await moveTemplateDataToPermanentLocation({ userId, uploadId, bucket });

  try {
    const template = await templateRepository.createOrFail({ id, name, type, s3Key, userId });
    return template;
  } catch (error) {
    await deleteObject({ bucket, key: s3Key });

    throw error;
  }
}

export async function createTemplate(
  event: APIGatewayProxyWithCognitoAuthorizerEvent,
  context: Context,
): Promise<APIGatewayProxyResult> {
  try {
    setLoggerContext(event, context);
    logger.info('createTemplate.starting');

    const validatedData = validateBody(event, createTemplateRequestDto);
    logger.info(validatedData, 'createTemplate.validatedData');

    const userId = getUserIdFromEventOrFail(event);
    const template = await createTemplateWithData({ userId, requestData: validatedData });

    const response: CreateTemplateResponseDto = template.toPublicJson();
    logger.info('createTemplate.success');
    return {
      body: JSON.stringify(response),
      statusCode: 201,
    };
  } catch (error) {
    return handleApiError({ error, logPrefix: 'createTemplate' });
  }
}
