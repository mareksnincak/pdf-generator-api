import { type Schema } from 'type-fest';

import { type GetUrlForTemplateUploadRequestDto } from '../dtos/request.dto';

export class GetUrlForTemplateUploadRequestMockFactory {
  create(
    overrides: Partial<Schema<GetUrlForTemplateUploadRequestDto, string>> = {},
  ): Schema<GetUrlForTemplateUploadRequestDto, string> {
    return {
      fileSizeBytes: '1024',
      ...overrides,
    };
  }
}
