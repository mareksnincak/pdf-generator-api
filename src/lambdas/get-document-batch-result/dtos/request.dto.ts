import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import z from 'zod';

import { batchIdDto } from '../../../dtos/batch-id.dto';

extendZodWithOpenApi(z);

export const getDocumentBatchResultRequestDto = batchIdDto;

export type GetDocumentBatchResultRequestDto = z.infer<typeof getDocumentBatchResultRequestDto>;
