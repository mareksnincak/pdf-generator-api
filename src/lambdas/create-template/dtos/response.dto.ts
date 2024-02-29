import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

export const createTemplateResponseDto = z.object({
  templateId: z
    .string()
    .uuid()
    .openapi({ description: 'Template id. Autogenerated if not provided.' }),
});

export type CreateTemplateResponseDto = z.infer<typeof createTemplateResponseDto>;