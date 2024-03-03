import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

import { templateIdDto } from '../../../dtos/template-id.dto';

extendZodWithOpenApi(z);

export const getTemplateRequestDto = templateIdDto;

export type GetTemplateRequestDto = z.infer<typeof getTemplateRequestDto>;
