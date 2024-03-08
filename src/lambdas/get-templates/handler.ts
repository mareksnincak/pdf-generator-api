import type {
  APIGatewayProxyResult,
  APIGatewayProxyWithCognitoAuthorizerEvent,
  Context,
} from 'aws-lambda';

import { getMany } from '../../db/template/repository';
import { handleApiError } from '../../helpers/error.helper';
import { getUserIdFromEventOrFail } from '../../helpers/event.helper';
import { logger, setLoggerContext } from '../../helpers/logger.helper';
import { validateQueryParams } from '../../helpers/validation.helper';

import { getTemplatesRequestDto } from './dtos/request.dto';
import { type GetTemplatesResponseDto } from './dtos/response.dto';

export async function getTemplates(
  event: APIGatewayProxyWithCognitoAuthorizerEvent,
  context: Context,
): Promise<APIGatewayProxyResult> {
  try {
    setLoggerContext(event, context);
    logger.info('getTemplates.starting');

    const validatedQueryParams = validateQueryParams(event, getTemplatesRequestDto);
    logger.info(validatedQueryParams, 'getUrlForTemplateUpload.validatedQueryParams');

    const userId = getUserIdFromEventOrFail(event);
    const { limit, paginationToken } = validatedQueryParams;
    const { templates, nextPaginationToken } = await getMany({ userId, limit, paginationToken });

    const response: GetTemplatesResponseDto = {
      nextPaginationToken: nextPaginationToken ?? null,
      templates: templates.map((template) => template.toPublicJson()),
    };
    logger.info('getTemplates.success');
    return {
      statusCode: 200,
      body: JSON.stringify(response),
    };
  } catch (error) {
    return handleApiError({ error, logPrefix: 'getTemplates' });
  }
}
