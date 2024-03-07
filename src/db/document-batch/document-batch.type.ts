import { type PrimaryKey } from '../common/types/entity.type';

import { type DocumentBatchStatus } from './document-batch.enum';

export type DocumentBatchError = { ref: string; message: string };

export type DocumentBatchGeneratedDocument = { ref: string; url: string };

export type DocumentBatch = {
  id: string;
  userId: string;
  status: DocumentBatchStatus;
  errors: DocumentBatchError[];
  generatedDocuments: DocumentBatchGeneratedDocument[];
};

export type StoredDocumentBatch = DocumentBatch & PrimaryKey;
