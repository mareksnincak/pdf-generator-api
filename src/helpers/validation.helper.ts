import type { APIGatewayProxyEvent } from 'aws-lambda';
import { type ZodTypeAny, type z } from 'zod';
import { fromZodError } from 'zod-validation-error';

import { BadRequestError } from '../errors/bad-request.error';

export function validate<T extends ZodTypeAny>(data: unknown, dto: T): z.infer<T> {
  const parsedData = dto.safeParse(data ?? {});

  if (!parsedData.success) {
    const message = fromZodError(parsedData.error, { prefix: null }).toString();
    throw new BadRequestError({ message });
  }

  return parsedData.data;
}

export function validateQueryParams<T extends ZodTypeAny>(
  event: Pick<APIGatewayProxyEvent, 'queryStringParameters'>,
  dto: T,
): z.infer<T> {
  return validate(event.queryStringParameters, dto);
}

export function validatePathParams<T extends ZodTypeAny>(
  event: Pick<APIGatewayProxyEvent, 'pathParameters'>,
  dto: T,
): z.infer<T> {
  return validate(event.pathParameters, dto);
}

export function validateBody<T extends ZodTypeAny>(
  event: Pick<APIGatewayProxyEvent, 'body'>,
  dto: T,
): z.infer<T> {
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
