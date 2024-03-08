import type {
  APIGatewayProxyResult,
  APIGatewayProxyWithCognitoAuthorizerEvent,
  Context,
} from 'aws-lambda';

import * as templateRepository from '../../db/template/repository';
import { handleApiError } from '../../helpers/error.helper';
import { getUserIdFromEventOrFail } from '../../helpers/event.helper';
import { logger, setLoggerContext } from '../../helpers/logger.helper';
import { validatePathParams } from '../../helpers/validation.helper';

import { getTemplateRequestDto } from './dtos/request.dto';
import { type GetTemplateResponseDto } from './dtos/response.dto';

export async function getTemplate(
  event: APIGatewayProxyWithCognitoAuthorizerEvent,
  context: Context,
): Promise<APIGatewayProxyResult> {
  try {
    setLoggerContext(event, context);
    logger.info('getTemplate.starting');

    const validatedParams = validatePathParams(event, getTemplateRequestDto);
    logger.info(validatedParams, 'getTemplate.validatedParams');

    const { id } = validatedParams;

    const userId = getUserIdFromEventOrFail(event);
    const template = await templateRepository.getByIdOrFail({ id, userId });

    const response: GetTemplateResponseDto = await template.toPublicJsonWithDataUrl();
    logger.info('getTemplate.success');
    return {
      statusCode: 200,
      body: JSON.stringify(response),
    };
  } catch (error) {
    return handleApiError({ error, logPrefix: 'getTemplate' });
  }
}
