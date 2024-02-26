import { z } from 'zod';

export const createTemplateResponseDto = z.object({
  templateId: z.string().uuid(),
});

export type CreateTemplateResponseDto = z.infer<typeof createTemplateResponseDto>;
