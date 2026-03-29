import { type RouteConfig } from '@asteasolutions/zod-to-openapi';

import { ErrorMessage } from '../../../enums/error.enum';
import { httpErrorDto } from '../../../errors/dtos/http-error.dto';
import { deleteTemplateRequestDto } from '../dtos/request.dto';

export const deleteTemplateRoute: RouteConfig = {
  description: 'Delete template.',
  method: 'delete',
  path: '/templates/{id}',
  request: {
    params: deleteTemplateRequestDto,
  },
  responses: {
    204: {
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
  summary: 'Delete template',
  tags: ['templates'],
};
