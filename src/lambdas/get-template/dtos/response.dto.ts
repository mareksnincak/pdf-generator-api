import type z from 'zod';

import { templateResponseDto } from '../../../dtos/template-response.dto';

export const getTemplateResponseDto = templateResponseDto;

export type GetTemplateResponseDto = z.infer<typeof getTemplateResponseDto>;
