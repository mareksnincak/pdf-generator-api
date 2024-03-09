import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import z from 'zod';

import { templateDto } from '../../../dtos/template.dto';

extendZodWithOpenApi(z);

export const getTemplateResponseDto = templateDto.extend({
  dataUrl: z.string().openapi({
    description: 'Url to template data.',
    example: 'https://data.example.com/template',
  }),
});

export type GetTemplateResponseDto = z.infer<typeof getTemplateResponseDto>;
