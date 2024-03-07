import { BadRequestError } from '../errors/bad-request.error';
import { ConflictError } from '../errors/conflict.error';
import { HttpError } from '../errors/http.error';
import { NotFoundError } from '../errors/not-found.error';

import { handleApiError, getErrorResponse } from './error.helper';
import { mockLogger } from './test.helper';

afterEach(() => {
  jest.resetAllMocks();
});

describe('getErrorResponse', () => {
  it('should return message from HttpError', () => {
    mockLogger();
    const error = new HttpError(400, {
      message: 'Custom error message',
    });

    const result = getErrorResponse({ error, logPrefix: 'test' });

    expect(result).toEqual({
      message: 'Custom error message',
    });
  });

  it('should return default message on unknown error', () => {
    mockLogger();
    const error = new Error('Custom error message');

    const result = getErrorResponse({ error, logPrefix: 'test' });

    expect(result).toEqual({
      message: 'Internal server error',
    });
  });
});

describe('handleApiError', () => {
  it.each([
    [400, BadRequestError],
    [404, NotFoundError],
    [409, ConflictError],
  ])('should return %i response on HttpError', (statusCode, HttpError) => {
    mockLogger();
    const error = new HttpError({
      message: 'Custom error message',
    });

    const result = handleApiError({ error, logPrefix: 'test' });

    expect(result).toEqual({
      body: '{"message":"Custom error message"}',
      statusCode,
    });
  });

  it('should return 500 response on unknown error', () => {
    mockLogger();
    const error = new Error('Custom error message');

    const result = handleApiError({ error, logPrefix: 'test' });

    expect(result).toEqual({
      body: '{"message":"Internal server error"}',
      statusCode: 500,
    });
  });
});
