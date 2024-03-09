import { randomUUID } from 'node:crypto';

import { DocumentBatchStatus } from '../../../db/document-batch/enum';
import { type StoreDocumentBatchResultInputDto } from '../dtos/input.dto';

export class StoreDocumentBatchResultInputMockFactory {
  create(
    overrides: Partial<StoreDocumentBatchResultInputDto> = {},
  ): StoreDocumentBatchResultInputDto {
    return {
      id: randomUUID(),
      userId: randomUUID(),
      status: DocumentBatchStatus.completed,
      results: [],
      ...overrides,
    };
  }
}
