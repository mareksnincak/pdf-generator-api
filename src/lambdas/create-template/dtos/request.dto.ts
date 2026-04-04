import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

import { templateDto } from '../../../dtos/template.dto';

extendZodWithOpenApi(z);

export const createTemplateRequestDto = z.object({
  name: templateDto.shape.name,
  type: templateDto.shape.type,
  uploadId: z.uuid().openapi({ description: 'Upload id from GET /templates/upload-url api call.' }),
});

export type CreateTemplateRequestDto = z.infer<typeof createTemplateRequestDto>;
