import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import z from 'zod';

import { batchIdDto } from '../../../dtos/batch-id.dto';

extendZodWithOpenApi(z);

export const startDocumentBatchGenerationResponseDto = batchIdDto;

export type StartDocumentBatchGenerationResponseDto = z.infer<
  typeof startDocumentBatchGenerationResponseDto
>;
