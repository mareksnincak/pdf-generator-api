import { type RouteConfig } from '@asteasolutions/zod-to-openapi';

import { ErrorMessage } from '../../../enums/error.enum';
import { httpErrorDto } from '../../../errors/dtos/http-error.dto';
import { getDocumentBatchResultRequestDto } from '../dtos/request.dto';
import { getDocumentBatchResultResponseDto } from '../dtos/response.dto';

export const getDocumentBatchResultRoute: RouteConfig = {
  description: 'Get document batch result.',
  method: 'get',
  path: '/documents/batch/{id}',
  request: {
    params: getDocumentBatchResultRequestDto,
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: getDocumentBatchResultResponseDto,
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
  },
  summary: 'Get document batch result',
  tags: ['documents'],
};
