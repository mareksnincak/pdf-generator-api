import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

export const batchIdDto = z.object({
  id: z.string().uuid().openapi({
    description: 'Batch id.',
  }),
});

export type BatchIdDto = z.infer<typeof batchIdDto>;
