import { type APIGatewayProxyResult } from 'aws-lambda';

import { HttpError } from '../errors/http.error';

import { logger } from './logger.helper';

export function getErrorResponse({ error, logPrefix }: { error: unknown; logPrefix: string }): {
  message: string;
} {
  if (error instanceof HttpError) {
    const errorData = error.getData();

    logger.warn(errorData, `${logPrefix}.httpError`);
    return { message: errorData.response.message };
  }

  logger.error(error, `${logPrefix}.unknownError`);
  return { message: 'Internal server error' };
}

export function handleApiError({
  error,
  logPrefix,
}: {
  error: unknown;
  logPrefix: string;
}): APIGatewayProxyResult {
  const response = getErrorResponse({ error, logPrefix });

  return {
    statusCode: 500,
    body: JSON.stringify(response),
  };
}
