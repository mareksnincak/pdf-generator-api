import type { APIGatewayProxyWithCognitoAuthorizerEvent } from 'aws-lambda';

import * as templateRepository from '../../db/template/repository';
import { ErrorFormat } from '../../helpers/error.helper';
import { getUserIdFromEventOrFail } from '../../helpers/event.helper';
import { wrapHandler } from '../../helpers/handler.helper';
import { logger } from '../../helpers/logger.helper';
import { validatePathParams } from '../../helpers/validation.helper';

import { deleteTemplateRequestDto } from './dtos/request.dto';

async function handler(event: APIGatewayProxyWithCognitoAuthorizerEvent) {
  logger.info('deleteTemplate.starting');

  const validatedData = validatePathParams(event, deleteTemplateRequestDto);
  logger.info(validatedData, 'deleteTemplate.validatedData');

  const { id } = validatedData;

  const userId = getUserIdFromEventOrFail(event);
  await templateRepository.deleteByIdOrFail({ id, userId });

  logger.info('deleteTemplate.success');
  return {
    body: '',
    statusCode: 204,
  };
}

export const deleteTemplate = wrapHandler(handler, {
  errorFormat: ErrorFormat.API,
  logPrefix: 'deleteTemplate',
});
