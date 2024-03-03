import { type RouteConfig } from '@asteasolutions/zod-to-openapi';

import { templateIdDto } from '../../../dtos/template-id.dto';
import { getTemplatesResponseDto } from '../dtos/response.dto';

export const getTemplatesRoute: RouteConfig = {
  method: 'get',
  path: '/templates',
  tags: ['templates'],
  summary: 'Get templates',
  description: 'Get templates.',
  request: {
    params: templateIdDto,
  },
  responses: {
    200: {
      description: 'Success.',
      content: {
        'application/json': {
          schema: getTemplatesResponseDto,
        },
      },
    },
  },
};
