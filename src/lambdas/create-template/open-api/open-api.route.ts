import { type RouteConfig } from '@asteasolutions/zod-to-openapi';

import { ErrorMessage } from '../../../enums/error.enum';
import { httpErrorDto } from '../../../errors/dtos/http-error.dto';
import { createTemplateRequestDto } from '../dtos/request.dto';
import { createTemplateResponseDto } from '../dtos/response.dto';

export const createTemplateRoute: RouteConfig = {
  method: 'post',
  path: '/templates',
  tags: ['templates'],
  summary: 'Create template',
  description:
    'Before calling this endpoint `GET /templates/upload-url` should be called and file should be uploaded to returned url.',
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
      description: 'Success.',
      content: {
        'application/json': {
          schema: createTemplateResponseDto,
        },
      },
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
      description: ErrorMessage.templateDataNotFound,
      content: {
        'application/json': {
          schema: httpErrorDto,
        },
      },
    },
    409: {
      description: ErrorMessage.templateAlreadyExists,
      content: {
        'application/json': {
          schema: httpErrorDto,
        },
      },
    },
  },
};
