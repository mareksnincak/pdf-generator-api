import { type PrimaryKey } from '../common/types/entity.type';

import { type DocumentBatchStatus } from './enum';

export type DocumentBatchError = { message: string; ref: null | string };

export type DocumentBatchGeneratedDocument = { ref: string; s3Key: string };

export type DocumentBatch = {
  createdAt: Date;
  errors: DocumentBatchError[];
  expiresAt: Date;
  generatedDocuments: DocumentBatchGeneratedDocument[];
  id: string;
  status: DocumentBatchStatus;
  userId: string;
};

export type StoredDocumentBatch = PrimaryKey &
  Omit<DocumentBatch, 'createdAt' | 'expiresAt'> & {
    createdAt: number;
    expiresAt: number;
  };
