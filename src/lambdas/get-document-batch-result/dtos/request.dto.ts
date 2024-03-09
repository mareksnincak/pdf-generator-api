import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import z from 'zod';

extendZodWithOpenApi(z);

// TODO extract to common dto
export const getDocumentBatchResultRequestDto = z.object({
  id: z.string().uuid().openapi({
    description: 'Batch id.',
  }),
});

export type GetDocumentBatchResultRequestDto = z.infer<typeof getDocumentBatchResultRequestDto>;
