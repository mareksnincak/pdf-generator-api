import { randomUUID } from 'node:crypto';

import { addHoursToDate } from '../../helpers/date.helper';

import { DocumentBatchEntity } from './entity';
import { DocumentBatchStatus } from './enum';

export class DocumentBatchEntityMockFactory {
  create(overrides: Partial<DocumentBatchEntity> = {}): DocumentBatchEntity {
    return new DocumentBatchEntity({
      userId: randomUUID(),
      status: DocumentBatchStatus.inProgress,
      expiresAt: addHoursToDate(new Date(), 1),
      ...overrides,
    });
  }
}
