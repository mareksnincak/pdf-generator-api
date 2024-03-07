import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

import { generateDocumentRequestDto } from '../../generate-document-api-gw/dtos/request.dto';

extendZodWithOpenApi(z);

const documentDto = generateDocumentRequestDto.extend({
  ref: z.string().min(1).max(64).openapi({
    description: 'Unique document reference. Used to match document entry with generation result.',
  }),
});

export const startDocumentBatchGenerationRequestDto = z
  .object({
    documents: z.array(documentDto).openapi({ description: 'Documents to generate.' }),
  })
  .refine(({ documents }) => {
    const documentRefs = documents.map((document) => document.ref);
    const uniqueDocumentRefs = [...new Set(documentRefs)];

    return documentRefs.length === uniqueDocumentRefs.length;
  }, 'Document refs must be unique');

export type StartDocumentBatchGenerationDocumentRequestDto = z.infer<typeof documentDto>;

export type StartDocumentBatchGenerationRequestDto = z.infer<
  typeof startDocumentBatchGenerationRequestDto
>;
