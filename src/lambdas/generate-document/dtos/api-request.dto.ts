import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

import { templateDto } from '../../../dtos/template.dto';

extendZodWithOpenApi(z);

export const generateDocumentFromApiEventRequestDto = z.object({
  templateId: templateDto.shape.id,
  data: z.record(z.string(), z.unknown()).openapi({
    description: 'Data to insert to template.',
    example: {
      name: 'John Smith',
    },
  }),
});

export type GenerateDocumentFromApiEventRequestDto = z.infer<
  typeof generateDocumentFromApiEventRequestDto
>;
