import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

export const getUrlForTemplateUploadResponseDto = z.object({
  uploadId: z.string().uuid().openapi({ description: 'Unique id identifying current upload.' }),
  url: z.string().openapi({
    description:
      'Url where data should be uploaded by sending PUT request with binary data payload.',
    example: 'https://upload.example.com/upload-here',
  }),
});

export type GetUrlForTemplateUploadResponseDto = z.infer<typeof getUrlForTemplateUploadResponseDto>;
