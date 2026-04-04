import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

import { MalwareScanStatus, TemplateType } from '../db/template/enum';

extendZodWithOpenApi(z);

export const templateDto = z.object({
  id: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-zA-Z0-9\-_]+$/)
    .openapi({ description: 'Template id.', example: 'templateId' }),
  malwareScanStatus: z
    .enum(MalwareScanStatus)
    .openapi({ description: 'Status of the malware scan.', example: MalwareScanStatus.clean }),
  name: z
    .string()
    .min(1)
    .max(64)
    .openapi({ description: 'Template name.', example: 'Template name' }),
  type: z.enum(TemplateType).openapi({ description: 'Template type.' }),
});

export type TemplateDto = z.infer<typeof templateDto>;
