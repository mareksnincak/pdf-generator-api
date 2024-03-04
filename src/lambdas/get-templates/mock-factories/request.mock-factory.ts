import { type Schema } from 'type-fest';

import { type GetTemplatesRequestDto } from '../dtos/request.dto';

export class GetTemplatesRequestMockFactory {
  create(
    overrides: Partial<Schema<GetTemplatesRequestDto, string>> = {},
  ): Schema<GetTemplatesRequestDto, string> {
    return {
      limit: '10',
      ...overrides,
    };
  }
}
