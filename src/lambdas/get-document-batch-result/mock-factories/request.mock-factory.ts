import { randomUUID } from 'node:crypto';

import { type Schema } from 'type-fest';

import { type GetDocumentBatchResultRequestDto } from '../dtos/request.dto';

export class GetDocumentBatchResultRequestMockFactory {
  create(
    overrides: Partial<Schema<GetDocumentBatchResultRequestDto, string>> = {},
  ): Schema<GetDocumentBatchResultRequestDto, string> {
    return {
      id: randomUUID(),
      ...overrides,
    };
  }
}
