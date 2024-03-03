import type {
  APIGatewayProxyResult,
  APIGatewayProxyWithCognitoAuthorizerEvent,
  Context,
} from 'aws-lambda';

import { getMany } from '../../db/template/template.repository';
import { handleError } from '../../helpers/error.helper';
import { getUserIdFromEventOrFail } from '../../helpers/event.helper';
import { logger, setLoggerContext } from '../../helpers/logger.helper';

import { type GetTemplatesResponseDto } from './dtos/response.dto';

export async function getTemplates(
  event: APIGatewayProxyWithCognitoAuthorizerEvent,
  context: Context,
): Promise<APIGatewayProxyResult> {
  try {
    setLoggerContext(event, context);
    logger.info('getTemplates.starting');

    const userId = getUserIdFromEventOrFail(event);
    const templates = await getMany({ userId });

    const response: GetTemplatesResponseDto = templates.map((template) => template.toPublicJson());
    logger.info('getTemplates.success');
    return {
      statusCode: 200,
      body: JSON.stringify(response),
    };
  } catch (error) {
    return handleError({ error, logPrefix: 'getTemplates' });
  }
}
