import pino from 'pino';
import { lambdaRequestTracker, pinoLambdaDestination } from 'pino-lambda';

import { getUserIdFromEvent } from './event.helper';

const destination = pinoLambdaDestination();

export const logger = pino(
  { level: process.env.LOG_LEVEL ?? 'debug', nestedKey: 'payload' },
  destination,
);

export const setLoggerContext = lambdaRequestTracker({
  requestMixin(event) {
    return {
      userId: getUserIdFromEvent(event),
    };
  },
});
