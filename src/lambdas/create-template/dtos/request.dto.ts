import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

import { templateDto } from '../../../dtos/template.dto';

extendZodWithOpenApi(z);

export const createTemplateRequestDto = z.object({
  id: templateDto.shape.id.optional(),
  name: templateDto.shape.name,
  uploadId: z
    .string()
    .uuid()
    .openapi({ description: 'Upload id from GET /templates/upload-url api call.' }),
  type: templateDto.shape.type,
});

export type CreateTemplateRequestDto = z.infer<typeof createTemplateRequestDto>;
