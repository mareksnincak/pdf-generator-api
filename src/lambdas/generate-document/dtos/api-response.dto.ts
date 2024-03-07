import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import z from 'zod';

extendZodWithOpenApi(z);

export const generateDocumentFromApiEventResponseDto = z.object({
  url: z.string().openapi({
    description: 'Url to generated document.',
    example: 'https://upload.example.com/upload-here',
  }),
});

export type GenerateDocumentFromApiEventResponseDto = z.infer<
  typeof generateDocumentFromApiEventResponseDto
>;
