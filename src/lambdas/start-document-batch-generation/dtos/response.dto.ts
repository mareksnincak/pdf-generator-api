import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import z from 'zod';

extendZodWithOpenApi(z);

export const startDocumentGenerationBatchResponseDto = z.object({
  id: z.string().uuid().openapi({
    description: 'Batch id.',
  }),
});

export type StartDocumentGenerationBatchResponseDto = z.infer<
  typeof startDocumentGenerationBatchResponseDto
>;
