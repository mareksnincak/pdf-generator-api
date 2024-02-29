import { type RouteConfig } from '@asteasolutions/zod-to-openapi';
import { deleteTemplateRequestDto } from '../dtos/request.dto';
import { ErrorMessage } from '../../../enums/error.enum';
import { httpErrorDto } from '../../../errors/dtos/http-error.dto';

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
