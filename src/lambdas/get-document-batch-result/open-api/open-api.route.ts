import { type RouteConfig } from '@asteasolutions/zod-to-openapi';

import { ErrorMessage } from '../../../enums/error.enum';
import { httpErrorDto } from '../../../errors/dtos/http-error.dto';
import { getDocumentBatchResultRequestDto } from '../dtos/request.dto';
import { getDocumentBatchResultResponseDto } from '../dtos/response.dto';

export const getDocumentBatchResultRoute: RouteConfig = {
  method: 'get',
  path: '/documents/batch/{id}',
  tags: ['documents'],
  summary: 'Get document batch result',
  description: 'Get document batch result.',
  request: {
    params: getDocumentBatchResultRequestDto,
  },
  responses: {
    200: {
      description: 'Success.',
      content: {
        'application/json': {
          schema: getDocumentBatchResultResponseDto,
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
