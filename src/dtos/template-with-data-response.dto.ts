import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

import { templateDto } from './template.dto';

extendZodWithOpenApi(z);

export const templateWithDataUrlDto = templateDto.extend({
  dataUrl: z.string().openapi({
    description: 'Url to template data.',
    example: 'https://data.example.com/template',
  }),
});

export type TemplateWithDataUrlDto = z.infer<typeof templateWithDataUrlDto>;
