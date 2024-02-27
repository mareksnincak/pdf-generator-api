import { type RouteConfig } from '@asteasolutions/zod-to-openapi';
import { getUrlForTemplateUploadRequestDto } from '../dtos/get-url-for-template-upload-request.dto';
import { getUrlForTemplateUploadResponseDto } from '../dtos/get-url-for-template-upload-response.dto';

export const getUrlForTemplateUploadRoute: RouteConfig = {
  method: 'get',
  path: '/templates/upload-url',
  tags: ['templates'],
  summary: 'Get url for template upload.',
  request: {
    query: getUrlForTemplateUploadRequestDto,
  },
  responses: {
    200: {
      description: 'Data for template upload.',
      content: {
        'application/json': {
          schema: getUrlForTemplateUploadResponseDto,
        },
      },
    },
  },
};
