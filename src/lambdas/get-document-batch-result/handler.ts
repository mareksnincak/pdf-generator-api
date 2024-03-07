import type {
  APIGatewayProxyResult,
  APIGatewayProxyWithCognitoAuthorizerEvent,
  Context,
} from 'aws-lambda';

import { handleApiError } from '../../helpers/error.helper';
import { logger, setLoggerContext } from '../../helpers/logger.helper';
import { validatePathParams } from '../../helpers/validation.helper';

import { getDocumentBatchResultRequestDto } from './dtos/request.dto';
import { DocumentBatchStatus, type GetDocumentBatchResultResponseDto } from './dtos/response.dto';

export async function getDocumentBatchResult(
  event: APIGatewayProxyWithCognitoAuthorizerEvent,
  context: Context,
): Promise<APIGatewayProxyResult> {
  try {
    setLoggerContext(event, context);
    logger.info('getDocumentBatchResult.starting');

    const validatedData = validatePathParams(event, getDocumentBatchResultRequestDto);
    logger.info(validatedData, 'getDocumentBatchResult.validatedData');

    // const { id } = validatedData;
    // const userId = getUserIdFromEventOrFail(event);

    const response: GetDocumentBatchResultResponseDto = {
      status: DocumentBatchStatus.completed,
      errors: [],
      generatedDocuments: [],
    };
    logger.info(response, 'getDocumentBatchResult.response');
    return {
      body: JSON.stringify(response),
      statusCode: 200,
    };
  } catch (error) {
    return handleApiError({ error, logPrefix: 'getDocumentBatchResult' });
  }
}
