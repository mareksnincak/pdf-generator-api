import { z } from 'zod';

export const getUrlForTemplateUploadResponseDto = z.object({
  uploadId: z.string().uuid(),
  url: z.string(),
});

export type GetUrlForTemplateUploadResponseDto = z.infer<typeof getUrlForTemplateUploadResponseDto>;
