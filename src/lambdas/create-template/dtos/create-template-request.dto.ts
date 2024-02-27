import { z } from 'zod';
import { TemplateType } from '../../../db/template/template.enum';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

export const createTemplateRequestDto = z.object({
  id: z.string().min(1).max(64).optional().openapi({ description: 'Template id.' }),
  name: z.string().min(1).max(64).openapi({ description: 'Template name.' }),
  uploadId: z
    .string()
    .uuid()
    .openapi({ description: 'Upload id from GET /templates/upload-url api call.' }),
  type: z.nativeEnum(TemplateType).openapi({ description: 'Template type.' }),
});

export type CreateTemplateRequestDto = z.infer<typeof createTemplateRequestDto>;
