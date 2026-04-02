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

export function wrapHandler<TEvent extends object, TResult>(
  fn: (event: TEvent) => Promise<TResult>,
  options: { errorFormat: ErrorFormat; logPrefix: string },
): AsyncHandler<TEvent, TResult> {
  const { errorFormat, logPrefix } = options;

  const wrapped: AsyncHandler<TEvent, TResult> = async (event, context) => {
    setLoggerContext(event, context);
    try {
      return await fn(event);
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
