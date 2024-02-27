import { type RouteConfig } from '@asteasolutions/zod-to-openapi';
import { createTemplateRequestDto } from '../dtos/create-template-request.dto';
import { createTemplateResponseDto } from '../dtos/create-template-response.dto';

export const createTemplateRoute: RouteConfig = {
  method: 'post',
  path: '/templates',
  tags: ['templates'],
  summary: 'Create template',
  request: {
    body: {
      content: {
        'application/json': {
          schema: createTemplateRequestDto,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Template data.',
      content: {
        'application/json': {
          schema: createTemplateResponseDto,
        },
      },
    },
  },
};
