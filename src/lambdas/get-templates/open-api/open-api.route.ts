import { type RouteConfig } from '@asteasolutions/zod-to-openapi';

import { ErrorMessage } from '../../../enums/error.enum';
import { httpErrorDto } from '../../../errors/dtos/http-error.dto';
import { getTemplatesRequestDto } from '../dtos/request.dto';
import { getTemplatesResponseDto } from '../dtos/response.dto';

export const getTemplatesRoute: RouteConfig = {
  description: 'Get templates.',
  method: 'get',
  path: '/templates',
  request: {
    query: getTemplatesRequestDto,
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: getTemplatesResponseDto,
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
  summary: 'Get templates',
  tags: ['templates'],
};
