import { randomUUID } from 'node:crypto';

import type { AttributeValue } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { type SetOptional } from 'type-fest';

import { BaseEntity } from '../base/base.entity';
import { type PrimaryKey } from '../common/types/entity.type';

import { type DocumentBatchStatus } from './document-batch.enum';
import {
  type DocumentBatchError,
  type DocumentBatch,
  type StoredDocumentBatch,
  type DocumentBatchGeneratedDocument,
} from './document-batch.type';

export class DocumentBatchEntity extends BaseEntity {
  constructor({
    id = randomUUID(),
    userId,
    status,
    errors = [],
    generatedDocuments = [],
  }: SetOptional<DocumentBatch, 'id' | 'errors' | 'generatedDocuments'>) {
    const primaryKey = DocumentBatchEntity.getPrimaryKey({ id, userId });

    super({ primaryKey });

    this.id = id;
    this.userId = userId;
    this.status = status;
    this.errors = errors;
    this.generatedDocuments = generatedDocuments;
  }

  public id: string;

  public userId: string;

  public status: DocumentBatchStatus;

  public errors: DocumentBatchError[];

  public generatedDocuments: DocumentBatchGeneratedDocument[];

  async toDynamoItem(): Promise<Record<string, AttributeValue>> {
    const item: StoredDocumentBatch = {
      ...this.primaryKey,
      id: this.id,
      userId: this.userId,
      status: this.status,
      errors: this.errors,
      generatedDocuments: this.generatedDocuments,
    };

    const result = marshall(item, {
      removeUndefinedValues: true,
    });

    return result;
  }

  static fromDynamoItem(item: Record<string, AttributeValue>): DocumentBatchEntity {
    const rawTemplate = unmarshall(item) as StoredDocumentBatch;

    return new DocumentBatchEntity(rawTemplate);
  }

  public static getPrimaryKey({ id, userId }: { id: string; userId: string }): PrimaryKey {
    return {
      PK: `DOCUMENT_BATCH#USER#${userId}#ID#${id}`,
      SK: '#',
    };
  }

  public static getDynamoPrimaryKey({ id, userId }: { id: string; userId: string }) {
    return marshall(this.getPrimaryKey({ id, userId }));
  }

  public toPublicJson() {
    return {
      id: this.id,
      status: this.status,
      errors: this.errors,
      generatedDocuments: this.generatedDocuments,
    };
  }

  // public async toPublicJsonWithDataUrl() {
  //   const bucket = getEnvVariableOrFail('S3_BUCKET');
  //   const dataUrl = await getPresignedShareUrl({
  //     bucket,
  //     key: this.s3Key,
  //   });

  //   return {
  //     ...this.toPublicJson(),
  //     dataUrl,
  //   };
  // }
}
