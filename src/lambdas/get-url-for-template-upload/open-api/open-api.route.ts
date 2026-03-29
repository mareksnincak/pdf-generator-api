import { type RouteConfig } from '@asteasolutions/zod-to-openapi';

import { ErrorMessage } from '../../../enums/error.enum';
import { httpErrorDto } from '../../../errors/dtos/http-error.dto';
import { getUrlForTemplateUploadRequestDto } from '../dtos/request.dto';
import { getUrlForTemplateUploadResponseDto } from '../dtos/response.dto';

export const getUrlForTemplateUploadRoute: RouteConfig = {
  method: 'get',
  path: '/templates/upload-url',
  request: {
    query: getUrlForTemplateUploadRequestDto,
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: getUrlForTemplateUploadResponseDto,
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
  summary: 'Get url for template upload',
  tags: ['templates'],
};
