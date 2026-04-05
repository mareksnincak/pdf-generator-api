import { randomUUID } from 'node:crypto';

import { S3ServiceException } from '@aws-sdk/client-s3';
import type { APIGatewayProxyWithCognitoAuthorizerEvent } from 'aws-lambda';
import Handlebars from 'handlebars';

import { MalwareScanStatus } from '../../db/template/enum';
import * as templateRepository from '../../db/template/repository';
import { ErrorMessage } from '../../enums/error.enum';
import { S3ExceptionName } from '../../enums/s3.enum';
import { BadRequestError } from '../../errors/bad-request.error';
import { NotFoundError } from '../../errors/not-found.error';
import { getEnvVariableOrFail } from '../../helpers/env.helper';
import { ErrorFormat } from '../../helpers/error.helper';
import { getUserIdFromEventOrFail } from '../../helpers/event.helper';
import { wrapHandler } from '../../helpers/handler.helper';
import { logger } from '../../helpers/logger.helper';
import { deleteObject, getObject, moveObject } from '../../helpers/s3.helper';
import { validateBody } from '../../helpers/validation.helper';

import { type CreateTemplateRequestDto, createTemplateRequestDto } from './dtos/request.dto';
import { type CreateTemplateResponseDto } from './dtos/response.dto';

async function getTemplateContent({ bucket, key }: { bucket: string; key: string }) {
  try {
    const content = await getObject({ bucket, key });
    return content;
  } catch (error) {
    if (error instanceof S3ServiceException && error.name === S3ExceptionName.noSuchKey) {
      throw new NotFoundError({
        message: ErrorMessage.templateDataNotFound,
      });
    }

    throw error;
  }
}

async function validateTemplateContent({ bucket, key }: { bucket: string; key: string }) {
  const content = await getTemplateContent({ bucket, key });

  if (content.length === 0) {
    throw new BadRequestError({ message: ErrorMessage.invalidTemplateContent });
  }

  try {
    Handlebars.precompile(content.toString());
  } catch {
    throw new BadRequestError({ message: ErrorMessage.invalidTemplateContent });
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
  const uploadedDataS3Key = `templates/uploads/${userId}/${uploadId}`;
  const storedDataS3Key = `templates/data/${userId}/${id}`;

  await validateTemplateContent({ bucket, key: uploadedDataS3Key });

  await moveObject({
    destinationBucket: bucket,
    destinationKey: storedDataS3Key,
    sourceBucket: bucket,
    sourceKey: uploadedDataS3Key,
  });

  try {
    const template = await templateRepository.createOrFail({
      id,
      malwareScanStatus: MalwareScanStatus.pending,
      name,
      s3Key: storedDataS3Key,
      type,
      userId,
    });
    return template;
  } catch (error) {
    await deleteObject({ bucket, key: storedDataS3Key });

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
