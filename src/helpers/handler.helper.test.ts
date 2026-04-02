import type { APIGatewayProxyResult } from 'aws-lambda';

import { ContextMockFactory } from '../mock-factories/context.mock-factory';

import { ErrorData, ErrorFormat } from './error.helper';
import * as errorHelper from './error.helper';
import { wrapHandler } from './handler.helper';
import * as loggerHelper from './logger.helper';
import { mockLogger } from './test.helper';

const context = new ContextMockFactory().create();

afterEach(() => {
  jest.clearAllMocks();
});

describe('wrapHandler', () => {
  it('should call setLoggerContext with event and context', async () => {
    const setLoggerContextSpy = jest.spyOn(loggerHelper, 'setLoggerContext').mockImplementation();
    const event = { key: 'value' };
    const handler = jest.fn().mockResolvedValue({ statusCode: 200 });

    const wrapped = wrapHandler(handler, { errorFormat: ErrorFormat.API, logPrefix: 'test' });
    await wrapped(event, context);

    expect(setLoggerContextSpy).toHaveBeenCalledWith(event, context);
  });

  it('should return handler result on success', async () => {
    jest.spyOn(loggerHelper, 'setLoggerContext').mockImplementation();
    const event = { key: 'value' };
    const expectedResult = { body: JSON.stringify({}), statusCode: 200 };
    const handler = jest.fn().mockResolvedValue(expectedResult);

    const wrapped = wrapHandler(handler, { errorFormat: ErrorFormat.API, logPrefix: 'test' });
    const result = await wrapped(event, context);

    expect(result).toEqual(expectedResult);
  });

  it('should pass event and context to handler', async () => {
    jest.spyOn(loggerHelper, 'setLoggerContext').mockImplementation();
    const event = { key: 'value' };
    const handler = jest.fn().mockResolvedValue({});

    const wrapped = wrapHandler(handler, { errorFormat: ErrorFormat.RAW, logPrefix: 'test' });
    await wrapped(event, context);

    expect(handler).toHaveBeenCalledWith(event, context);
  });

  describe('ErrorFormat.API', () => {
    it('should return handleError result on error', async () => {
      mockLogger();
      jest.spyOn(loggerHelper, 'setLoggerContext').mockImplementation();
      const error = new Error('test error');
      const handler = jest.fn().mockRejectedValue(error);
      const expectedResult: APIGatewayProxyResult = {
        body: JSON.stringify({ message: 'Internal server error.' }),
        statusCode: 500,
      };
      const handleErrorSpy = jest
        .spyOn(errorHelper, 'handleError')
        .mockReturnValue(expectedResult as unknown as ErrorData);

      const wrapped = wrapHandler(handler, { errorFormat: ErrorFormat.API, logPrefix: 'test' });
      const result = await wrapped({ key: 'value' }, context);

      expect(handleErrorSpy).toHaveBeenCalledWith({
        error,
        format: ErrorFormat.API,
        logPrefix: 'test',
      });
      expect(result).toEqual(expectedResult);
    });
  });

  describe('ErrorFormat.RAW', () => {
    it('should call handleError and rethrow error', async () => {
      mockLogger();
      jest.spyOn(loggerHelper, 'setLoggerContext').mockImplementation();
      const error = new Error('test error');
      const handler = jest.fn().mockRejectedValue(error);
      const handleErrorSpy = jest.spyOn(errorHelper, 'handleError').mockReturnValue({
        response: { message: 'Internal server error.' },
        statusCode: 500,
      });

      const wrapped = wrapHandler(handler, { errorFormat: ErrorFormat.RAW, logPrefix: 'test' });

      await expect(wrapped({ key: 'value' }, context)).rejects.toThrow(error);
      expect(handleErrorSpy).toHaveBeenCalledWith({
        error,
        format: ErrorFormat.RAW,
        logPrefix: 'test',
      });
    });
  });
});
