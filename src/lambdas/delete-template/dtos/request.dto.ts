import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

export const deleteTemplateRequestDto = z.object({
  id: z
    .string()
    .min(1)
    .max(64)
    .openapi({ description: 'Template id.', example: 'customTemplateId' }),
});

export type DeleteTemplateRequestDto = z.infer<typeof deleteTemplateRequestDto>;
