import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

import { DocumentBatchStatus } from '../../../db/document-batch/enum';
import { batchIdDto } from '../../../dtos/batch-id.dto';

extendZodWithOpenApi(z);

export const getDocumentBatchResultResponseDto = z.object({
  errors: z
    .array(
      z.object({
        message: z.string().openapi({ description: 'Error message.' }),
        ref: z.string().nullable().openapi({ description: 'Document reference.' }),
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
  id: batchIdDto.shape.id,
  status: z.enum(DocumentBatchStatus).openapi({
    description: 'Status.',
  }),
});

export type GetDocumentBatchResultResponseDto = z.infer<typeof getDocumentBatchResultResponseDto>;
