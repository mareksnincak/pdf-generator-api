import { type PrimaryKey } from '../common/types/entity.type';

import { type DocumentBatchStatus } from './document-batch.enum';

export type DocumentBatchError = { ref: string | null; message: string };

export type DocumentBatchGeneratedDocument = { ref: string; s3Key: string };

export type DocumentBatch = {
  id: string;
  userId: string;
  status: DocumentBatchStatus;
  errors: DocumentBatchError[];
  generatedDocuments: DocumentBatchGeneratedDocument[];
};

export type StoredDocumentBatch = DocumentBatch & PrimaryKey;
