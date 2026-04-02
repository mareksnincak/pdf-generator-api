import { ErrorMessage } from '../enums/error.enum';
import { BadRequestError } from '../errors/bad-request.error';
import { ConflictError } from '../errors/conflict.error';
import { NotFoundError } from '../errors/not-found.error';

import { ErrorFormat, handleError } from './error.helper';
import { mockLogger } from './test.helper';

afterEach(() => {
  jest.clearAllMocks();
});

describe('handleError', () => {
  describe('raw format', () => {
    it.each([
      [400, BadRequestError],
      [404, NotFoundError],
      [409, ConflictError],
    ])('should return %i response on HttpError', (statusCode, HttpError) => {
      mockLogger();
      const error = new HttpError({
        message: 'Custom error message',
      });

      const result = handleError({ error, format: ErrorFormat.RAW, logPrefix: 'test' });

      expect(result).toEqual({
        response: { message: 'Custom error message' },
        statusCode,
      });
    });

    it('should return 500 response on unknown error', () => {
      mockLogger();
      const error = new Error('Custom error message');

      const result = handleError({ error, format: ErrorFormat.RAW, logPrefix: 'test' });

      expect(result).toEqual({
        response: { message: ErrorMessage.internalServerError },
        statusCode: 500,
      });
    });
  });

  describe('api format', () => {
    it.each([
      [400, BadRequestError],
      [404, NotFoundError],
      [409, ConflictError],
    ])('should return %i response on HttpError', (statusCode, HttpError) => {
      mockLogger();
      const error = new HttpError({
        message: 'Custom error message',
      });

      const result = handleError({ error, format: ErrorFormat.API, logPrefix: 'test' });

      expect(result).toEqual({
        body: '{"message":"Custom error message"}',
        statusCode,
      });
    });

    it('should return 500 response on unknown error', () => {
      mockLogger();
      const error = new Error('Custom error message');

      const result = handleError({ error, format: ErrorFormat.API, logPrefix: 'test' });

      expect(result).toEqual({
        body: '{"message":"Internal server error."}',
        statusCode: 500,
      });
    });
  });
});
