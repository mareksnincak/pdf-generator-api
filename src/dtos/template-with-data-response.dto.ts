import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

import { templateResponseDto } from './template-response.dto';

extendZodWithOpenApi(z);

export const templateWithDataResponseDto = templateResponseDto.extend({
  dataUrl: z.string().openapi({
    description: 'Url to template data.',
    example: 'https://data.example.com/template',
  }),
});

export type TemplateWithDataResponseDto = z.infer<typeof templateWithDataResponseDto>;
