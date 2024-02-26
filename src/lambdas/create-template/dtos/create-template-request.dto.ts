import { z } from 'zod';
import { TemplateType } from '../../../db/template/template.enum';

export const createTemplateRequestDto = z.object({
  id: z.string().min(1).max(64).optional(),
  name: z.string().min(1).max(64),
  uploadId: z.string().uuid(),
  type: z.nativeEnum(TemplateType),
});

export type CreateTemplateRequestDto = z.infer<typeof createTemplateRequestDto>;
