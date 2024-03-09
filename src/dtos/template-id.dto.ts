import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

import { templateDto } from './template.dto';

extendZodWithOpenApi(z);

export const templateIdDto = z.object({
  id: templateDto.shape.id,
});

export type TemplateIdDto = z.infer<typeof templateIdDto>;
