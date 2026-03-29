import { type RouteConfig } from '@asteasolutions/zod-to-openapi';

import { ErrorMessage } from '../../../enums/error.enum';
import { httpErrorDto } from '../../../errors/dtos/http-error.dto';
import { createTemplateRequestDto } from '../dtos/request.dto';
import { createTemplateResponseDto } from '../dtos/response.dto';

export const createTemplateRoute: RouteConfig = {
  description:
    'Before calling this endpoint `GET /templates/upload-url` should be called and file should be uploaded to returned url.',
  method: 'post',
  path: '/templates',
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
    201: {
      content: {
        'application/json': {
          schema: createTemplateResponseDto,
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
      description: ErrorMessage.templateDataNotFound,
    },
    409: {
      content: {
        'application/json': {
          schema: httpErrorDto,
        },
      },
      description: ErrorMessage.templateAlreadyExists,
    },
  },
  summary: 'Create template',
  tags: ['templates'],
};
