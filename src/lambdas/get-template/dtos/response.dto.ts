import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import z from 'zod';

import { templateWithDataResponseDto } from '../../../dtos/template-with-data-response.dto';

extendZodWithOpenApi(z);

export const getTemplateResponseDto = templateWithDataResponseDto;

export type GetTemplateResponseDto = z.infer<typeof getTemplateResponseDto>;
