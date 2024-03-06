import { type RouteConfig } from '@asteasolutions/zod-to-openapi';

import { ErrorMessage } from '../../../enums/error.enum';
import { httpErrorDto } from '../../../errors/dtos/http-error.dto';
import { getUrlForTemplateUploadRequestDto } from '../dtos/request.dto';
import { getUrlForTemplateUploadResponseDto } from '../dtos/response.dto';

export const getUrlForTemplateUploadRoute: RouteConfig = {
  method: 'get',
  path: '/templates/upload-url',
  tags: ['templates'],
  summary: 'Get url for template upload',
  request: {
    query: getUrlForTemplateUploadRequestDto,
  },
  responses: {
    200: {
      description: 'Success.',
      content: {
        'application/json': {
          schema: getUrlForTemplateUploadResponseDto,
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
