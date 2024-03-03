import { type RouteConfig } from '@asteasolutions/zod-to-openapi';

import { getTemplatesRequestDto } from '../dtos/request.dto';
import { getTemplatesResponseDto } from '../dtos/response.dto';

export const getTemplatesRoute: RouteConfig = {
  method: 'get',
  path: '/templates',
  tags: ['templates'],
  summary: 'Get templates',
  description: 'Get templates.',
  request: {
    query: getTemplatesRequestDto,
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
