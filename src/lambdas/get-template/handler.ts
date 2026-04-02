import type { APIGatewayProxyWithCognitoAuthorizerEvent } from 'aws-lambda';

import * as templateRepository from '../../db/template/repository';
import { ErrorFormat } from '../../helpers/error.helper';
import { getUserIdFromEventOrFail } from '../../helpers/event.helper';
import { wrapHandler } from '../../helpers/handler.helper';
import { logger } from '../../helpers/logger.helper';
import { validatePathParams } from '../../helpers/validation.helper';

import { getTemplateRequestDto } from './dtos/request.dto';
import { type GetTemplateResponseDto } from './dtos/response.dto';

async function handler(event: APIGatewayProxyWithCognitoAuthorizerEvent) {
  logger.info('getTemplate.starting');

  const validatedParams = validatePathParams(event, getTemplateRequestDto);
  logger.info(validatedParams, 'getTemplate.validatedParams');

  const { id } = validatedParams;

  const userId = getUserIdFromEventOrFail(event);
  const template = await templateRepository.getByIdOrFail({ id, userId });

  const response: GetTemplateResponseDto = await template.toPublicJsonWithDataUrl();
  logger.info('getTemplate.success');
  return {
    body: JSON.stringify(response),
    statusCode: 200,
  };
}

export const getTemplate = wrapHandler(handler, {
  errorFormat: ErrorFormat.API,
  logPrefix: 'getTemplate',
});
