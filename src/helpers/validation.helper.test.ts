import z from 'zod';
import { validateQueryParams } from './validation.helper';

describe('validateQueryParams', () => {
  it('should pass when data is valid', () => {
    const dto = z.object({
      foo: z.string().min(1).max(10),
    });

    const queryStringParameters = { foo: 'bar' };
    const event = { queryStringParameters };

    const result = validateQueryParams(event, dto);

    expect(result).toEqual(queryStringParameters);
  });
});
