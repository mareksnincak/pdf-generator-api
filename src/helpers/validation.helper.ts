import type { APIGatewayProxyEvent } from 'aws-lambda';
import { type ZodObject, type ZodRawShape } from 'zod';
import { fromZodError } from 'zod-validation-error';
import { BadRequestError } from '../errors/bad-request.error';

export function validateBody<T extends ZodRawShape>(
  event: APIGatewayProxyEvent,
  dto: ZodObject<T>,
) {
  try {
    const data = JSON.parse(event.body ?? '');
    const parsedData = dto.safeParse(data);

    if (!parsedData.success) {
      const message = fromZodError(parsedData.error, { prefix: null }).toString();
      throw new BadRequestError({ message });
    }

    return parsedData.data;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new BadRequestError({ message: 'Invalid JSON' });
    }

    throw error;
  }
}
