import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import z from 'zod';

import { templateResponseDto } from '../../../dtos/template-response.dto';

extendZodWithOpenApi(z);

export const getTemplatesResponseDto = z.object({
  nextPaginationToken: z.string().nullable().openapi({ description: 'Pagination token.' }),
  templates: z.array(templateResponseDto).openapi({ description: 'Array of templates.' }),
});

export type GetTemplatesResponseDto = z.infer<typeof getTemplatesResponseDto>;
