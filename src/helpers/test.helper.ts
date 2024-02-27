import { logger } from './logger.helper';

export function mockLogger() {
  jest.spyOn(logger, 'debug').mockImplementation();
  jest.spyOn(logger, 'info').mockImplementation();
  jest.spyOn(logger, 'warn').mockImplementation();
  jest.spyOn(logger, 'error').mockImplementation();
}
