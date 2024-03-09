import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import z from 'zod';

extendZodWithOpenApi(z);

export const startDocumentBatchGenerationResponseDto = z.object({
  id: z.string().uuid().openapi({
    description: 'Batch id.',
  }),
});

export type StartDocumentBatchGenerationResponseDto = z.infer<
  typeof startDocumentBatchGenerationResponseDto
>;
