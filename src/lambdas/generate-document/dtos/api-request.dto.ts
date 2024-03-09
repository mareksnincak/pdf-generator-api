import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

export const generateDocumentFromApiEventRequestDto = z.object({
  templateId: z
    .string()
    .min(1)
    .max(64)
    .openapi({ description: 'Template id.', example: 'templateId' }),
  data: z.record(z.string(), z.unknown()).openapi({
    description: 'Data to insert to template.',
    example: {
      name: 'John Smith',
    },
  }),
});

export type GenerateDocumentFromApiEventRequestDto = z.infer<
  typeof generateDocumentFromApiEventRequestDto
>;
