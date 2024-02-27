import { type RouteConfig } from '@asteasolutions/zod-to-openapi';
import { createTemplateRequestDto } from '../dtos/create-template-request.dto';
import { createTemplateResponseDto } from '../dtos/create-template-response.dto';
import { ErrorMessage } from '../../../enums/error.enum';
import { httpErrorDto } from '../../../errors/dtos/http-error.dto';

export const createTemplateRoute: RouteConfig = {
  method: 'post',
  path: '/templates',
  tags: ['templates'],
  summary: 'Create template.',
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
    200: {
      description: 'Template data.',
      content: {
        'application/json': {
          schema: createTemplateResponseDto,
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
  },
};
