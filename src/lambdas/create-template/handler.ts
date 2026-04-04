import { randomUUID } from 'node:crypto';

import { S3ServiceException } from '@aws-sdk/client-s3';
import type { APIGatewayProxyWithCognitoAuthorizerEvent } from 'aws-lambda';

import { MalwareScanStatus } from '../../db/template/enum';
import * as templateRepository from '../../db/template/repository';
import { ErrorMessage } from '../../enums/error.enum';
import { S3ExceptionName } from '../../enums/s3.enum';
import { NotFoundError } from '../../errors/not-found.error';
import { getEnvVariableOrFail } from '../../helpers/env.helper';
import { ErrorFormat } from '../../helpers/error.helper';
import { getUserIdFromEventOrFail } from '../../helpers/event.helper';
import { wrapHandler } from '../../helpers/handler.helper';
import { logger } from '../../helpers/logger.helper';
import { deleteObject, moveObject } from '../../helpers/s3.helper';
import { validateBody } from '../../helpers/validation.helper';

import { type CreateTemplateRequestDto, createTemplateRequestDto } from './dtos/request.dto';
import { type CreateTemplateResponseDto } from './dtos/response.dto';

async function moveTemplateDataToPermanentLocation({
  bucket,
  id,
  uploadId,
  userId,
}: {
  bucket: string;
  id: string;
  uploadId: string;
  userId: string;
}) {
  try {
    // TODO validate html
    const uploadedDataS3Key = `${userId}/templates/uploads/${uploadId}`;
    const storedDataS3Key = `${userId}/templates/data/${id}`;

    await moveObject({
      destinationBucket: bucket,
      destinationKey: storedDataS3Key,
      sourceBucket: bucket,
      sourceKey: uploadedDataS3Key,
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
  requestData: { name, type, uploadId },
  userId,
}: {
  requestData: CreateTemplateRequestDto;
  userId: string;
}) {
  const bucket = getEnvVariableOrFail('S3_BUCKET');

  const id = randomUUID();
  const s3Key = await moveTemplateDataToPermanentLocation({ bucket, id, uploadId, userId });

  try {
    const template = await templateRepository.createOrFail({
      id,
      malwareScanStatus: MalwareScanStatus.pending,
      name,
      s3Key,
      type,
      userId,
    });
    return template;
  } catch (error) {
    await deleteObject({ bucket, key: s3Key });

    throw error;
  }
}

async function handler(event: APIGatewayProxyWithCognitoAuthorizerEvent) {
  logger.info('createTemplate.starting');

  const validatedData = validateBody(event, createTemplateRequestDto);
  logger.info(validatedData, 'createTemplate.validatedData');

  const userId = getUserIdFromEventOrFail(event);
  const template = await createTemplateWithData({ requestData: validatedData, userId });

  const response: CreateTemplateResponseDto = template.toPublicJson();
  logger.info('createTemplate.success');
  return {
    body: JSON.stringify(response),
    statusCode: 201,
  };
}

export const createTemplate = wrapHandler(handler, {
  errorFormat: ErrorFormat.API,
  logPrefix: 'createTemplate',
});
