import { randomUUID } from 'node:crypto';

import { type PartialDeep } from 'type-fest';

import { addHoursToDate } from '../../helpers/date.helper';

import { DocumentBatchEntity } from './entity';
import { DocumentBatchStatus } from './enum';
import { type DocumentBatchError, type DocumentBatchGeneratedDocument } from './type';

export class DocumentBatchErrorMockFactory {
  create(overrides: Partial<DocumentBatchError> = {}): DocumentBatchError {
    return {
      message: randomUUID(),
      ref: randomUUID(),
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
  create(
    overrides: PartialDeep<DocumentBatchEntity, { recurseIntoArrays: true }> = {},
  ): DocumentBatchEntity {
    const errorFactory = new DocumentBatchErrorMockFactory();
    const generatedDocumentFactory = new DocumentBatchGeneratedDocumentMockFactory();

    let errors: DocumentBatchError[] = [];
    let generatedDocuments: DocumentBatchGeneratedDocument[] = [];

    if (overrides.errors) {
      errors = overrides.errors.map((override) => errorFactory.create(override));
    }

    if (overrides.generatedDocuments) {
      generatedDocuments = overrides.generatedDocuments.map((override) =>
        generatedDocumentFactory.create(override),
      );
    }

    return new DocumentBatchEntity({
      expiresAt: addHoursToDate(new Date(), 1),
      status: DocumentBatchStatus.inProgress,
      userId: randomUUID(),
      ...overrides,
      errors,
      generatedDocuments,
    });
  }
}
