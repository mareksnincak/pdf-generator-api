import { type APIGatewayProxyResult } from 'aws-lambda';

import { ErrorMessage } from '../enums/error.enum';
import { HttpError, type HttpErrorResponse } from '../errors/http.error';

import { logger } from './logger.helper';

export function handleError({ error, logPrefix }: { error: unknown; logPrefix: string }): {
  statusCode: number;
  response: HttpErrorResponse;
} {
  if (error instanceof HttpError) {
    const errorData = error.getData();

    logger.warn(errorData, `${logPrefix}.httpError`);
    return errorData;
  }

  logger.error(error, `${logPrefix}.unknownError`);
  return { statusCode: 500, response: { message: ErrorMessage.internalServerError } };
}

export function handleApiError({
  error,
  logPrefix,
}: {
  error: unknown;
  logPrefix: string;
}): APIGatewayProxyResult {
  const { statusCode, response } = handleError({ error, logPrefix });

  return {
    statusCode,
    body: JSON.stringify(response),
  };
}
