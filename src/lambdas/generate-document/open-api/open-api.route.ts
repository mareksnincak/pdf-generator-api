import { type RouteConfig } from '@asteasolutions/zod-to-openapi';

import { ErrorMessage } from '../../../enums/error.enum';
import { httpErrorDto } from '../../../errors/dtos/http-error.dto';
import { generateDocumentRequestDto } from '../dtos/request.dto';
import { generateDocumentResponseDto } from '../dtos/response.dto';

export const generateDocumentsRoute: RouteConfig = {
  method: 'post',
  path: '/documents/generate',
  tags: ['documents'],
  summary: 'Generate document',
  description: 'Generate document.',
  request: {
    body: {
      content: {
        'application/json': {
          schema: generateDocumentRequestDto,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Success.',
      content: {
        'application/json': {
          schema: generateDocumentResponseDto,
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
