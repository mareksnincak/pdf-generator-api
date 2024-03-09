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

import { deleteTemplateRequestDto } from './dtos/request.dto';

export async function deleteTemplate(
  event: APIGatewayProxyWithCognitoAuthorizerEvent,
  context: Context,
): Promise<APIGatewayProxyResult> {
  try {
    setLoggerContext(event, context);
    logger.info('deleteTemplate.starting');

    const validatedData = validatePathParams(event, deleteTemplateRequestDto);
    logger.info(validatedData, 'deleteTemplate.validatedData');

    const { id } = validatedData;

    const userId = getUserIdFromEventOrFail(event);
    await templateRepository.deleteByIdOrFail({ id, userId });

    logger.info('deleteTemplate.success');
    return {
      statusCode: 204,
      body: '',
    };
  } catch (error) {
    return handleApiError({ error, logPrefix: 'deleteTemplate' });
  }
}
