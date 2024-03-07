import { type RouteConfig } from '@asteasolutions/zod-to-openapi';

import { ErrorMessage } from '../../../enums/error.enum';
import { httpErrorDto } from '../../../errors/dtos/http-error.dto';
import { generateDocumentFromApiEventRequestDto } from '../dtos/api-request.dto';
import { generateDocumentFromApiEventResponseDto } from '../dtos/api-response.dto';

export const generateDocumentRoute: RouteConfig = {
  method: 'post',
  path: '/documents/generate',
  tags: ['documents'],
  summary: 'Generate document',
  description: 'Generate document.',
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
      description: 'Success.',
      content: {
        'application/json': {
          schema: generateDocumentFromApiEventResponseDto,
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
      description: ErrorMessage.templateNotFound,
      content: {
        'application/json': {
          schema: httpErrorDto,
        },
      },
    },
  },
};
