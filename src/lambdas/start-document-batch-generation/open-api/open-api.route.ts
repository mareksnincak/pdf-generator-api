import { type RouteConfig } from '@asteasolutions/zod-to-openapi';

import { ErrorMessage } from '../../../enums/error.enum';
import { httpErrorDto } from '../../../errors/dtos/http-error.dto';
import { startDocumentBatchGenerationRequestDto } from '../dtos/request.dto';
import { startDocumentGenerationBatchResponseDto } from '../dtos/response.dto';

export const generateDocumentsRoute: RouteConfig = {
  method: 'post',
  path: '/documents/batch/generate',
  tags: ['documents'],
  summary: 'Generate document batch',
  description: 'Generate document batch.',
  request: {
    body: {
      content: {
        'application/json': {
          schema: startDocumentBatchGenerationRequestDto,
        },
      },
    },
  },
  responses: {
    202: {
      description: 'Success. Batch was accepted for processing.',
      content: {
        'application/json': {
          schema: startDocumentGenerationBatchResponseDto,
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
  },
};
