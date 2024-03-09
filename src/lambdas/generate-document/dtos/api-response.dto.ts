import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import z from 'zod';

extendZodWithOpenApi(z);

export const generateDocumentFromApiEventResponseDto = z.object({
  url: z.string().openapi({
    description: 'Url to generated document.',
    example: 'https://document.example.com/my-document',
  }),
});

export type GenerateDocumentFromApiEventResponseDto = z.infer<
  typeof generateDocumentFromApiEventResponseDto
>;
