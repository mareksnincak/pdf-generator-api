import { z } from 'zod';

import { DocumentBatchStatus } from '../../../db/document-batch/enum';
import { generateDocumentFromSfnEventOutputDto } from '../../generate-document/dtos/sfn-output.dto';

export const storeDocumentBatchResultInputDto = z.object({
  id: z.string(),
  results: z.array(generateDocumentFromSfnEventOutputDto).optional().default([]),
  status: z.enum(DocumentBatchStatus),
  userId: z.string(),
});

export type StoreDocumentBatchResultInputDto = z.infer<typeof storeDocumentBatchResultInputDto>;
