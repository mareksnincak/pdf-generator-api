import { randomUUID } from 'node:crypto';

import type {
  APIGatewayProxyResult,
  APIGatewayProxyWithCognitoAuthorizerEvent,
  Context,
} from 'aws-lambda';

import { getEnvVariableOrFail, isLocal } from '../../helpers/env.helper';
import { handleApiError } from '../../helpers/error.helper';
import { getUserIdFromEventOrFail } from '../../helpers/event.helper';
import { logger, setLoggerContext } from '../../helpers/logger.helper';
import { startExecution } from '../../helpers/sfn.helper';
import { validateBody } from '../../helpers/validation.helper';

import {
  type StartDocumentBatchGenerationRequestDto,
  startDocumentBatchGenerationRequestDto,
} from './dtos/request.dto';
import { type StartDocumentBatchGenerationResponseDto } from './dtos/response.dto';

async function startStateMachineExecution(
  userId: string,
  requestData: StartDocumentBatchGenerationRequestDto,
) {
  const id = randomUUID();

  if (isLocal()) {
    logger.info('startDocumentBatchGeneration.startStateMachineExecution.skippingLocal');
    return id;
  }

  const stateMachineArn = getEnvVariableOrFail('STATE_MACHINE_ARN');

  await startExecution({
    stateMachineArn,
    name: id,
    input: {
      userId,
      requestData,
    },
  });

  return id;
}

export async function startDocumentBatchGeneration(
  event: APIGatewayProxyWithCognitoAuthorizerEvent,
  context: Context,
): Promise<APIGatewayProxyResult> {
  try {
    setLoggerContext(event, context);
    logger.info('startDocumentBatchGeneration.starting');

    const validatedData = validateBody(event, startDocumentBatchGenerationRequestDto);
    logger.info(validatedData, 'startDocumentBatchGeneration.validatedData');

    const userId = getUserIdFromEventOrFail(event);

    const id = await startStateMachineExecution(userId, validatedData);

    const response: StartDocumentBatchGenerationResponseDto = {
      id,
    };
    logger.info(response, 'startDocumentBatchGeneration.response');
    return {
      body: JSON.stringify(response),
      statusCode: 202,
    };
  } catch (error) {
    return handleApiError({ error, logPrefix: 'createTemplate' });
  }
}
