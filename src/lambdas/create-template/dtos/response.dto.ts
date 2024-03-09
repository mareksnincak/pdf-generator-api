import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import z from 'zod';

import { templateDto } from '../../../dtos/template.dto';

extendZodWithOpenApi(z);

export const createTemplateResponseDto = templateDto;

export type CreateTemplateResponseDto = z.infer<typeof createTemplateResponseDto>;
