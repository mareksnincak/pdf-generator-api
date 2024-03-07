import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import z from 'zod';

extendZodWithOpenApi(z);

export enum DocumentBatchStatus {
  inProgress = 'inProgress',
  completed = 'completed',
}

export const getDocumentBatchResultResponseDto = z.object({
  status: z.nativeEnum(DocumentBatchStatus).openapi({
    description: 'Status.',
  }),
  errors: z
    .array(
      z.object({
        ref: z.string().nullable().openapi({ description: 'Document reference.' }),
        message: z.string().openapi({ description: 'Error message.' }),
      }),
    )
    .openapi({
      description: 'Errors.',
    }),
  generatedDocuments: z
    .array(
      z.object({
        ref: z.string().nullable().openapi({ description: 'Document reference.' }),
        url: z.string().openapi({
          description: 'Url to generated document.',
          example: 'https://document.example.com/my-document',
        }),
      }),
    )
    .openapi({
      description: 'Successfully generated documents.',
    }),
});

export type GetDocumentBatchResultResponseDto = z.infer<typeof getDocumentBatchResultResponseDto>;
