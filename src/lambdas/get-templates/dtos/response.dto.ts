import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import z from 'zod';

import { templateResponseDto } from '../../../dtos/template-response.dto';

extendZodWithOpenApi(z);

export const getTemplatesResponseDto = z.array(templateResponseDto);

export type GetTemplatesResponseDto = z.infer<typeof getTemplatesResponseDto>;
