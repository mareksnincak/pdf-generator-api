import * as Sentry from '@sentry/aws-serverless';
import type {
  APIGatewayProxyResult,
  APIGatewayProxyWithCognitoAuthorizerEvent,
  Context,
} from 'aws-lambda';

import * as templateRepository from '../../db/template/repository';
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
  } catch (error) {
    return handleApiError({ error, logPrefix: 'getTemplates' });
  }
}

// TODO improve this, we should consider e.g. using Middy or creating one wrapper. We also need
// to improve IT tests, as due to type issue they are only testing underlying function, not main
// handler.
export const handler = Sentry.wrapHandler(getTemplates);
