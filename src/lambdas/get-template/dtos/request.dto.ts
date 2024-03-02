import { type z } from 'zod';

import { templateIdDto } from '../../../dtos/template-id.dto';

export const getTemplateRequestDto = templateIdDto;

export type GetTemplateRequestDto = z.infer<typeof getTemplateRequestDto>;
