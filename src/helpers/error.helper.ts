import { type APIGatewayProxyResult } from 'aws-lambda';

import { ErrorMessage } from '../enums/error.enum';
import { HttpError, type HttpErrorResponse } from '../errors/http.error';

import { logger } from './logger.helper';

export function handleError({ error, logPrefix }: { error: unknown; logPrefix: string }): {
  response: HttpErrorResponse;
  statusCode: number;
} {
  if (error instanceof HttpError) {
    const errorData = error.getData();

    logger.warn(errorData, `${logPrefix}.httpError`);
    return errorData;
  }

  logger.error(error, `${logPrefix}.unknownError`);
  return { response: { message: ErrorMessage.internalServerError }, statusCode: 500 };
}

export function handleApiError({
  error,
  logPrefix,
}: {
  error: unknown;
  logPrefix: string;
}): APIGatewayProxyResult {
  const { response, statusCode } = handleError({ error, logPrefix });

  return {
    body: JSON.stringify(response),
    statusCode,
  };
}
