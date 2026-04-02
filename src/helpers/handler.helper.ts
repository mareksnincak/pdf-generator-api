import * as Sentry from '@sentry/aws-serverless';
import type { Context } from 'aws-lambda';

import { ErrorFormat, handleError } from './error.helper';
import { setLoggerContext } from './logger.helper';

type AsyncHandler<TEvent, TResult> = (event: TEvent, context: Context) => Promise<TResult>;

const useSentry = !!process.env.SENTRY_DSN;

if (useSentry) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    integrations: [Sentry.pinoIntegration({ error: { levels: ['error', 'fatal'] } })],
  });
}

// TODO add tests
/**
 * Wraps an AWS Lambda handler with logging and error handling.
 * - On success, returns the handler result.
 * - On error:
 *   - `ErrorFormat.API` - logs error and returns APIGatewayProxyResult
 *   - `ErrorFormat.RAW` - logs error and rethrows error
 *
 * If `process.env.SENTRY_DSN` is set errors are also sent to Sentry.
 *
 * @returns Wrapped Lambda handler
 */
export function wrapHandler<TEvent extends object, TResult>(
  handler: (event: TEvent, context: Context) => Promise<TResult>,
  options: { errorFormat: ErrorFormat; logPrefix: string },
): AsyncHandler<TEvent, TResult> {
  const { errorFormat, logPrefix } = options;

  const wrapped: AsyncHandler<TEvent, TResult> = async (event, context) => {
    setLoggerContext(event, context);
    try {
      return await handler(event, context);
    } catch (error) {
      if (errorFormat === ErrorFormat.API) {
        return handleError({ error, format: errorFormat, logPrefix }) as TResult;
      }

      handleError({ error, format: errorFormat, logPrefix });
      throw error;
    }
  };

  return useSentry ? (Sentry.wrapHandler(wrapped) as AsyncHandler<TEvent, TResult>) : wrapped;
}
