import pino from 'pino';
import { lambdaRequestTracker, pinoLambdaDestination } from 'pino-lambda';

const destination = pinoLambdaDestination();

export const logger = pino({ level: 'debug', nestedKey: 'payload' }, destination);

export const setLoggerContext = lambdaRequestTracker();
