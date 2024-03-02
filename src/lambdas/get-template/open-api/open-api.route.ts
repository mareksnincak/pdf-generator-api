import { type RouteConfig } from '@asteasolutions/zod-to-openapi';

import { templateIdDto } from '../../../dtos/template-id.dto';
import { templateDto } from '../../../dtos/template.dto';
import { ErrorMessage } from '../../../enums/error.enum';
import { httpErrorDto } from '../../../errors/dtos/http-error.dto';

export const getTemplateRoute: RouteConfig = {
  method: 'get',
  path: '/templates/{id}',
  tags: ['templates'],
  summary: 'Get template',
  description: 'Get template.',
  request: {
    params: templateIdDto,
  },
  responses: {
    200: {
      description: 'Success.',
      content: {
        'application/json': {
          schema: templateDto,
        },
      },
    },
    404: {
      description: ErrorMessage.templateNotFound,
      content: {
        'application/json': {
          schema: httpErrorDto,
        },
      },
    },
  },
};
