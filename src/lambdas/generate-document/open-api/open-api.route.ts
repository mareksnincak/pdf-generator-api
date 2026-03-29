import { type RouteConfig } from '@asteasolutions/zod-to-openapi';

import { ErrorMessage } from '../../../enums/error.enum';
import { httpErrorDto } from '../../../errors/dtos/http-error.dto';
import { generateDocumentFromApiEventRequestDto } from '../dtos/api-request.dto';
import { generateDocumentFromApiEventResponseDto } from '../dtos/api-response.dto';

export const generateDocumentRoute: RouteConfig = {
  description: 'Generate document.',
  method: 'post',
  path: '/documents/generate',
  request: {
    body: {
      content: {
        'application/json': {
          schema: generateDocumentFromApiEventRequestDto,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: generateDocumentFromApiEventResponseDto,
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
  summary: 'Generate document',
  tags: ['documents'],
};
