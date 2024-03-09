import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

import { TemplateType } from '../db/template/enum';

extendZodWithOpenApi(z);

export const templateResponseDto = z.object({
  id: z.string().min(1).max(64).openapi({ description: 'Template id.', example: 'templateId' }),
  name: z
    .string()
    .min(1)
    .max(64)
    .openapi({ description: 'Template name.', example: 'Template name' }),
  type: z.nativeEnum(TemplateType).openapi({ description: 'Template type.' }),
});

export type TemplateResponseDto = z.infer<typeof templateResponseDto>;
