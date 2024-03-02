import { type z } from 'zod';

import { templateIdDto } from '../../../dtos/template-id.dto';

export const deleteTemplateRequestDto = templateIdDto;

export type DeleteTemplateRequestDto = z.infer<typeof deleteTemplateRequestDto>;
