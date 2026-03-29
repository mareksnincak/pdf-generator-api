import { type RouteConfig } from '@asteasolutions/zod-to-openapi';

import { templateIdDto } from '../../../dtos/template-id.dto';
import { ErrorMessage } from '../../../enums/error.enum';
import { httpErrorDto } from '../../../errors/dtos/http-error.dto';
import { getTemplateResponseDto } from '../dtos/response.dto';

export const getTemplateRoute: RouteConfig = {
  description: 'Get template.',
  method: 'get',
  path: '/templates/{id}',
  request: {
    params: templateIdDto,
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: getTemplateResponseDto,
        },
      },
      description: 'Success.',
    },
    400: {
      content: {
        'application/json': {
          schema: httpErrorDto,
        },
      },
      description: ErrorMessage.validationError,
    },
    404: {
      content: {
        'application/json': {
          schema: httpErrorDto,
        },
      },
      description: ErrorMessage.templateNotFound,
    },
  },
  summary: 'Get template',
  tags: ['templates'],
};
