import z from 'zod';
import { validateBody, validateQueryParams } from './validation.helper';
import { BadRequestError } from '../errors/bad-request.error';

describe('validateQueryParams', () => {
  it('should pass when data is valid', () => {
    const dto = z.object({
      foo: z.string(),
    });

    const queryStringParameters = { foo: 'bar' };
    const event = { queryStringParameters };

    const result = validateQueryParams(event, dto);

    expect(result).toEqual(queryStringParameters);
  });

  it('should transform data when coerce option is used', () => {
    const dto = z.object({
      foo: z.coerce.date(),
    });

    const date = new Date();
    const queryStringParameters = { foo: date.toISOString() };
    const event = { queryStringParameters };

    const result = validateQueryParams(event, dto);

    expect(result.foo).toEqual(date);
  });

  it('should throw error when data is not valid', () => {
    const dto = z.object({
      foo: z.number(),
    });

    const queryStringParameters = { foo: 'bar' };
    const event = { queryStringParameters };

    try {
      validateQueryParams(event, dto);
      expect(true).toEqual(false);
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestError);
      expect((error as BadRequestError).message).toEqual(
        'Expected number, received string at "foo"',
      );
    }
  });
});

describe('validateBody', () => {
  it('should pass when data is valid', () => {
    const dto = z.object({
      foo: z.string(),
    });

    const body = { foo: 'bar' };
    const event = { body: JSON.stringify(body) };

    const result = validateBody(event, dto);

    expect(result).toEqual(body);
  });

  it('should transform data when coerce option is used', () => {
    const dto = z.object({
      foo: z.coerce.date(),
    });

    const date = new Date();
    const body = { foo: date.toISOString() };
    const event = { body: JSON.stringify(body) };

    const result = validateBody(event, dto);

    expect(result.foo).toEqual(date);
  });

  it('should throw error when data is not valid', () => {
    const dto = z.object({
      foo: z.number(),
    });

    const body = { foo: 'bar' };
    const event = { body: JSON.stringify(body) };

    try {
      validateBody(event, dto);
      expect(true).toEqual(false);
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestError);
      expect((error as BadRequestError).message).toEqual(
        'Expected number, received string at "foo"',
      );
    }
  });
});
