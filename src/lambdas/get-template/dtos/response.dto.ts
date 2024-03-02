import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import z from 'zod';

import { templateResponseDto } from '../../../dtos/template-response.dto';

extendZodWithOpenApi(z);

export const getTemplateResponseDto = templateResponseDto.extend({
  dataUrl: z.string(),
});

export type GetTemplateResponseDto = z.infer<typeof getTemplateResponseDto>;
