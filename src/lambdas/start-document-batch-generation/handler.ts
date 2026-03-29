import type {
  APIGatewayProxyResult,
  APIGatewayProxyWithCognitoAuthorizerEvent,
  Context,
} from 'aws-lambda';

import { DocumentBatchStatus } from '../../db/document-batch/enum';
import * as documentBatchRepository from '../../db/document-batch/repository';
import { addHoursToDate } from '../../helpers/date.helper';
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

async function startStateMachineExecution({
  name,
  requestData,
  userId,
}: {
  name: string;
  requestData: StartDocumentBatchGenerationRequestDto;
  userId: string;
}) {
  if (isLocal()) {
    logger.info('startDocumentBatchGeneration.startStateMachineExecution.skippingLocal');
    return;
  }

  const stateMachineArn = getEnvVariableOrFail('STATE_MACHINE_ARN');
  await startExecution({
    input: {
      requestData,
      userId,
    },
    name,
    stateMachineArn,
  });
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
    const documentBatchTtlHours = Number(getEnvVariableOrFail('DOCUMENT_BATCH_TTL_HOURS'));

    const { id } = await documentBatchRepository.create({
      expiresAt: addHoursToDate(new Date(), documentBatchTtlHours),
      status: DocumentBatchStatus.inProgress,
      userId,
    });

    await startStateMachineExecution({
      name: id,
      requestData: validatedData,
      userId,
    });

    const response: StartDocumentBatchGenerationResponseDto = {
      id,
    };
    logger.info(response, 'startDocumentBatchGeneration.response');
    return {
      body: JSON.stringify(response),
      statusCode: 202,
    };
  } catch (error) {
    return handleApiError({ error, logPrefix: 'startDocumentBatchGeneration' });
  }
}
