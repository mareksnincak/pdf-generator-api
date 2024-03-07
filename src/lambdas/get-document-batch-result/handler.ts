import type {
  APIGatewayProxyResult,
  APIGatewayProxyWithCognitoAuthorizerEvent,
  Context,
} from 'aws-lambda';

import * as documentBatchRepository from '../../db/document-batch/document-batch.repository';
import { handleApiError } from '../../helpers/error.helper';
import { getUserIdFromEventOrFail } from '../../helpers/event.helper';
import { logger, setLoggerContext } from '../../helpers/logger.helper';
import { validatePathParams } from '../../helpers/validation.helper';

import { getDocumentBatchResultRequestDto } from './dtos/request.dto';
import { type GetDocumentBatchResultResponseDto } from './dtos/response.dto';

export async function getDocumentBatchResult(
  event: APIGatewayProxyWithCognitoAuthorizerEvent,
  context: Context,
): Promise<APIGatewayProxyResult> {
  try {
    setLoggerContext(event, context);
    logger.info('getDocumentBatchResult.starting');

    const validatedData = validatePathParams(event, getDocumentBatchResultRequestDto);
    logger.info(validatedData, 'getDocumentBatchResult.validatedData');

    const { id } = validatedData;
    const userId = getUserIdFromEventOrFail(event);

    const documentBatch = await documentBatchRepository.getByIdOrFail({ id, userId });

    const response: GetDocumentBatchResultResponseDto = await documentBatch.toPublicJson();
    logger.info(response, 'getDocumentBatchResult.response');
    return {
      body: JSON.stringify(response),
      statusCode: 200,
    };
  } catch (error) {
    return handleApiError({ error, logPrefix: 'getDocumentBatchResult' });
  }
}
