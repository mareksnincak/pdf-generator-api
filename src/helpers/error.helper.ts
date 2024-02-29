import { type APIGatewayProxyResult } from 'aws-lambda';

import { HttpError } from '../errors/http.error';

import { logger } from './logger.helper';

export function handleError({
  error,
  logPrefix,
}: {
  error: unknown;
  logPrefix: string;
}): APIGatewayProxyResult {
  if (error instanceof HttpError) {
    const errorData = error.getData();

    logger.warn(errorData, `${logPrefix}.httpError`);
    return {
      statusCode: errorData.statusCode,
      body: JSON.stringify({ message: errorData.response.message }),
    };
  }

  logger.error(error, `${logPrefix}.unknownError`);
  return {
    statusCode: 500,
    body: JSON.stringify({ message: 'Internal server error' }),
  };
}
