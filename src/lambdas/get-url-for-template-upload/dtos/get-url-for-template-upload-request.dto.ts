import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

const MB_IN_BYTES = 1024 * 1024;

export const getUrlForTemplateUploadRequestDto = z.object({
  fileSizeBytes: z.coerce
    .number()
    .min(1)
    .max(10 * MB_IN_BYTES)
    .openapi({
      description:
        'File size in bytes of file that will be uploaded. Allows file size up to 10 MB.',
    }),
});

export type GetUrlForTemplateUploadRequestDto = z.infer<typeof getUrlForTemplateUploadRequestDto>;
