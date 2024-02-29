import { BadRequestError } from '../errors/bad-request.error';
import { NotFoundError } from '../errors/not-found.error';

import { handleError } from './error.helper';
import { mockLogger } from './test.helper';

afterEach(() => {
  jest.resetAllMocks();
});

describe('handleError', () => {
  it.each([
    [400, BadRequestError],
    [404, NotFoundError],
  ])('should return %i response on HttpError', (statusCode, HttpError) => {
    mockLogger();
    const error = new HttpError({
      message: 'Custom error message',
    });

    const result = handleError({ error, logPrefix: 'test' });

    expect(result).toEqual({
      body: '{"message":"Custom error message"}',
      statusCode,
    });
  });

  it('should return 500 response on unknown error', () => {
    mockLogger();
    const error = new Error('Custom error message');

    const result = handleError({ error, logPrefix: 'test' });

    expect(result).toEqual({
      body: '{"message":"Internal server error"}',
      statusCode: 500,
    });
  });
});
