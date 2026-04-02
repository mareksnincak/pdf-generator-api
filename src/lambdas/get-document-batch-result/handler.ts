import type { APIGatewayProxyWithCognitoAuthorizerEvent } from 'aws-lambda';

import * as documentBatchRepository from '../../db/document-batch/repository';
import { ErrorFormat } from '../../helpers/error.helper';
import { getUserIdFromEventOrFail } from '../../helpers/event.helper';
import { wrapHandler } from '../../helpers/handler.helper';
import { logger } from '../../helpers/logger.helper';
import { validatePathParams } from '../../helpers/validation.helper';

import { getDocumentBatchResultRequestDto } from './dtos/request.dto';
import { type GetDocumentBatchResultResponseDto } from './dtos/response.dto';

async function handler(event: APIGatewayProxyWithCognitoAuthorizerEvent) {
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
}

export const getDocumentBatchResult = wrapHandler(handler, {
  errorFormat: ErrorFormat.API,
  logPrefix: 'getDocumentBatchResult',
});
