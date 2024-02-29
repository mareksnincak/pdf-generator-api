import z from 'zod';

import { BadRequestError } from '../errors/bad-request.error';

import {
  validate,
  validateBody,
  validatePathParams,
  validateQueryParams,
} from './validation.helper';

describe('validate', () => {
  it('should pass when data is valid', () => {
    const dto = z.object({
      foo: z.string(),
    });

    const data = { foo: 'bar' };

    const result = validate(data, dto);

    expect(result).toEqual(data);
  });

  it('should transform data when coerce option is used', () => {
    const dto = z.object({
      foo: z.coerce.date(),
    });

    const date = new Date();
    const data = { foo: date.toISOString() };

    const result = validate(data, dto);

    expect(result.foo).toEqual(date);
  });

  it('should throw error when data is not valid', () => {
    const dto = z.object({
      foo: z.number(),
    });

    const data = { foo: 'bar' };

    try {
      validate(data, dto);
      expect(true).toEqual(false);
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestError);
      expect((error as BadRequestError).message).toEqual(
        'Expected number, received string at "foo"',
      );
    }
  });
});

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

describe('validatePathParams', () => {
  it('should pass when data is valid', () => {
    const dto = z.object({
      foo: z.string(),
    });

    const pathParameters = { foo: 'bar' };
    const event = { pathParameters };

    const result = validatePathParams(event, dto);

    expect(result).toEqual(pathParameters);
  });

  it('should transform data when coerce option is used', () => {
    const dto = z.object({
      foo: z.coerce.date(),
    });

    const date = new Date();
    const pathParameters = { foo: date.toISOString() };
    const event = { pathParameters };

    const result = validatePathParams(event, dto);

    expect(result.foo).toEqual(date);
  });

  it('should throw error when data is not valid', () => {
    const dto = z.object({
      foo: z.number(),
    });

    const pathParameters = { foo: 'bar' };
    const event = { pathParameters };

    try {
      validatePathParams(event, dto);
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
