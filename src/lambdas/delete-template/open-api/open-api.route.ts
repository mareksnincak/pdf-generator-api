import { type RouteConfig } from '@asteasolutions/zod-to-openapi';

import { ErrorMessage } from '../../../enums/error.enum';
import { httpErrorDto } from '../../../errors/dtos/http-error.dto';
import { deleteTemplateRequestDto } from '../dtos/request.dto';

export const deleteTemplateRoute: RouteConfig = {
  method: 'delete',
  path: '/templates/{id}',
  tags: ['templates'],
  summary: 'Delete template',
  description: 'Delete template.',
  request: {
    params: deleteTemplateRequestDto,
  },
  responses: {
    204: {
      description: 'Success.',
    },
    400: {
      description: ErrorMessage.validationError,
      content: {
        'application/json': {
          schema: httpErrorDto,
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
