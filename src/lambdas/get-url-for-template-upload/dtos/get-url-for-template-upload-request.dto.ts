import { z } from 'zod';

const MB_IN_BYTES = 1024 * 1024;

export const getUrlForTemplateUploadRequestDto = z.object({
  fileSizeBytes: z.coerce
    .number()
    .min(1)
    .max(10 * MB_IN_BYTES),
});

export type GetUrlForTemplateUploadRequestDto = z.infer<typeof getUrlForTemplateUploadRequestDto>;
