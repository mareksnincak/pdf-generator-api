import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import z from 'zod';

import { templateDto } from '../../../dtos/template.dto';

extendZodWithOpenApi(z);

export const getTemplatesResponseDto = z.object({
  nextPaginationToken: z.string().nullable().openapi({ description: 'Pagination token.' }),
  templates: z.array(templateDto).openapi({ description: 'Array of templates.' }),
});

export type GetTemplatesResponseDto = z.infer<typeof getTemplatesResponseDto>;
