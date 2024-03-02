import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

import { templateIdDto } from '../../../dtos/template-id.dto';

extendZodWithOpenApi(z);

export const deleteTemplateRequestDto = templateIdDto;

export type DeleteTemplateRequestDto = z.infer<typeof deleteTemplateRequestDto>;
