import { type APIGatewayProxyResult } from 'aws-lambda';

import { ErrorMessage } from '../enums/error.enum';
import { HttpError, type HttpErrorResponse } from '../errors/http.error';

import { logger } from './logger.helper';

export enum ErrorFormat {
  API = 'api',
  RAW = 'raw',
}

interface ErrorData {
  response: HttpErrorResponse;
  statusCode: number;
}

export function handleError(params: {
  error: unknown;
  format: ErrorFormat.API;
  logPrefix: string;
}): APIGatewayProxyResult;

export function handleError(params: {
  error: unknown;
  format: ErrorFormat.RAW;
  logPrefix: string;
}): ErrorData;

/**
 * Normalizes and logs errors, returning either an API response or raw error data.
 *
 * Output depends on `format`:
 * - `ErrorFormat.API` - returns APIGatewayProxyResult
 * - `ErrorFormat.RAW` - returns `{ statusCode, response }` object
 */
export function handleError({
  error,
  format,
  logPrefix,
}: {
  error: unknown;
  format: ErrorFormat;
  logPrefix: string;
}): APIGatewayProxyResult | ErrorData {
  let errorData: ErrorData;

  if (error instanceof HttpError) {
    errorData = error.getData();
    logger.warn(errorData, `${logPrefix}.httpError`);
  } else {
    logger.error(error, `${logPrefix}.unknownError`);
    errorData = { response: { message: ErrorMessage.internalServerError }, statusCode: 500 };
  }

  if (format === ErrorFormat.API) {
    return {
      body: JSON.stringify(errorData.response),
      statusCode: errorData.statusCode,
    };
  }

  return errorData;
}
