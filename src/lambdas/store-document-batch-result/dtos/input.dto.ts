import { z } from 'zod';

import { DocumentBatchStatus } from '../../../db/document-batch/enum';
import { generateDocumentFromSfnEventOutputDto } from '../../generate-document/dtos/sfn-output.dto';

export const storeDocumentBatchResultInputDto = z.object({
  id: z.string(),
  userId: z.string(),
  status: z.nativeEnum(DocumentBatchStatus),
  results: z.array(generateDocumentFromSfnEventOutputDto).optional().default([]),
});

export type StoreDocumentBatchResultInputDto = z.infer<typeof storeDocumentBatchResultInputDto>;
