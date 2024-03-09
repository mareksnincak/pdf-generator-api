import { randomUUID } from 'node:crypto';

import { addHoursToDate } from '../../helpers/date.helper';

import { DocumentBatchEntity } from './entity';
import { DocumentBatchStatus } from './enum';
import { type DocumentBatchGeneratedDocument, type DocumentBatchError } from './type';

export class DocumentBatchErrorMockFactory {
  create(overrides: Partial<DocumentBatchError> = {}): DocumentBatchError {
    return {
      ref: randomUUID(),
      message: randomUUID(),
      ...overrides,
    };
  }
}

export class DocumentBatchGeneratedDocumentMockFactory {
  create(overrides: Partial<DocumentBatchGeneratedDocument> = {}): DocumentBatchGeneratedDocument {
    return {
      ref: randomUUID(),
      s3Key: randomUUID(),
      ...overrides,
    };
  }
}

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
