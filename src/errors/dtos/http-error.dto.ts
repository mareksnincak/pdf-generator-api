import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import z from 'zod';

extendZodWithOpenApi(z);

export const httpErrorDto = z.object({
  message: z.string().openapi({ description: 'Error message.', example: 'Error message.' }),
});
