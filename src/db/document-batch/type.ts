import { type PrimaryKey } from '../common/types/entity.type';

import { type DocumentBatchStatus } from './enum';

export type DocumentBatchError = { ref: string | null; message: string };

export type DocumentBatchGeneratedDocument = { ref: string; s3Key: string };

export type DocumentBatch = {
  id: string;
  userId: string;
  status: DocumentBatchStatus;
  errors: DocumentBatchError[];
  generatedDocuments: DocumentBatchGeneratedDocument[];
  createdAt: Date;
  expiresAt: Date;
};

export type StoredDocumentBatch = PrimaryKey &
  Omit<DocumentBatch, 'createdAt' | 'expiresAt'> & {
    createdAt: number;
    expiresAt: number;
  };
