import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

export const getTemplatesRequestDto = z.object({
  limit: z.coerce.number().min(1).max(50).default(10).openapi({
    description: 'Page size.',
    example: 10,
  }),
  paginationToken: z.string().optional().openapi({
    description: 'Pagination token from previous call.',
  }),
});

export type GetTemplatesRequestDto = z.infer<typeof getTemplatesRequestDto>;
