import type { APIGatewayProxyEvent } from 'aws-lambda';
import { type ZodObject, type ZodRawShape } from 'zod';
import { fromZodError } from 'zod-validation-error';

import { BadRequestError } from '../errors/bad-request.error';

export function validate<T extends ZodRawShape>(data: unknown, dto: ZodObject<T>) {
  const parsedData = dto.safeParse(data ?? {});

  if (!parsedData.success) {
    const message = fromZodError(parsedData.error, { prefix: null }).toString();
    throw new BadRequestError({ message });
  }

  return parsedData.data;
}

export function validateQueryParams<T extends ZodRawShape>(
  event: Pick<APIGatewayProxyEvent, 'queryStringParameters'>,
  dto: ZodObject<T>,
) {
  return validate(event.queryStringParameters, dto);
}

export function validatePathParams<T extends ZodRawShape>(
  event: Pick<APIGatewayProxyEvent, 'pathParameters'>,
  dto: ZodObject<T>,
) {
  return validate(event.pathParameters, dto);
}

export function validateBody<T extends ZodRawShape>(
  event: Pick<APIGatewayProxyEvent, 'body'>,
  dto: ZodObject<T>,
) {
  try {
    const data = JSON.parse(event.body ?? '');
    return validate(data, dto);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new BadRequestError({ message: 'Invalid JSON' });
    }

    throw error;
  }
}
