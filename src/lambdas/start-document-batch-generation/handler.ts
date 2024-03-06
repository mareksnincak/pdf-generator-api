import { randomUUID } from 'node:crypto';

import type {
  APIGatewayProxyResult,
  APIGatewayProxyWithCognitoAuthorizerEvent,
  Context,
} from 'aws-lambda';

import { handleError } from '../../helpers/error.helper';
import { logger, setLoggerContext } from '../../helpers/logger.helper';
import { validateBody } from '../../helpers/validation.helper';

import { startDocumentBatchGenerationRequestDto } from './dtos/request.dto';
import { type StartDocumentGenerationBatchResponseDto } from './dtos/response.dto';

export async function startDocumentBatchGeneration(
  event: APIGatewayProxyWithCognitoAuthorizerEvent,
  context: Context,
): Promise<APIGatewayProxyResult> {
  try {
    setLoggerContext(event, context);
    logger.info('startDocumentBatchGeneration.starting');

    const validatedData = validateBody(event, startDocumentBatchGenerationRequestDto);
    logger.info(validatedData, 'startDocumentBatchGeneration.validatedData');

    const response: StartDocumentGenerationBatchResponseDto = {
      id: randomUUID(),
    };
    logger.info(response, 'startDocumentBatchGeneration.response');
    return {
      body: JSON.stringify(response),
      statusCode: 202,
    };
  } catch (error) {
    return handleError({ error, logPrefix: 'createTemplate' });
  }
}
