import { type RouteConfig } from '@asteasolutions/zod-to-openapi';

import { ErrorMessage } from '../../../enums/error.enum';
import { httpErrorDto } from '../../../errors/dtos/http-error.dto';
import { startDocumentBatchGenerationRequestDto } from '../dtos/request.dto';
import { startDocumentBatchGenerationResponseDto } from '../dtos/response.dto';

export const startDocumentBatchGenerationRoute: RouteConfig = {
  description: 'Generate document batch.',
  method: 'post',
  path: '/documents/batch/generate',
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
      content: {
        'application/json': {
          schema: startDocumentBatchGenerationResponseDto,
        },
      },
      description: 'Success. Batch was accepted for processing.',
    },
    400: {
      content: {
        'application/json': {
          schema: httpErrorDto,
        },
      },
      description: ErrorMessage.validationError,
    },
  },
  summary: 'Generate document batch',
  tags: ['documents'],
};
