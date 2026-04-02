import type { APIGatewayProxyWithCognitoAuthorizerEvent } from 'aws-lambda';

import * as templateRepository from '../../db/template/repository';
import { ErrorFormat } from '../../helpers/error.helper';
import { getUserIdFromEventOrFail } from '../../helpers/event.helper';
import { wrapHandler } from '../../helpers/handler.helper';
import { logger } from '../../helpers/logger.helper';
import { validateQueryParams } from '../../helpers/validation.helper';

import { getTemplatesRequestDto } from './dtos/request.dto';
import { type GetTemplatesResponseDto } from './dtos/response.dto';

async function handler(event: APIGatewayProxyWithCognitoAuthorizerEvent) {
  logger.info('getTemplates.starting');

  const validatedQueryParams = validateQueryParams(event, getTemplatesRequestDto);
  logger.info(validatedQueryParams, 'getUrlForTemplateUpload.validatedQueryParams');

  const userId = getUserIdFromEventOrFail(event);
  const { limit, paginationToken } = validatedQueryParams;
  const { nextPaginationToken, templates } = await templateRepository.getMany({
    limit,
    paginationToken,
    userId,
  });

  const response: GetTemplatesResponseDto = {
    nextPaginationToken: nextPaginationToken ?? null,
    templates: templates.map((template) => template.toPublicJson()),
  };
  logger.info('getTemplates.success');
  return {
    body: JSON.stringify(response),
    statusCode: 200,
  };
}

export const getTemplates = wrapHandler(handler, {
  errorFormat: ErrorFormat.API,
  logPrefix: 'getTemplates',
});
