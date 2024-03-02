import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import z from 'zod';

import { templateResponseDto } from '../../../dtos/template-response.dto';

extendZodWithOpenApi(z);

export const createTemplateResponseDto = templateResponseDto;

export type CreateTemplateResponseDto = z.infer<typeof createTemplateResponseDto>;
