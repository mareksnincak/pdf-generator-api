import { randomUUID } from 'node:crypto';

import type { AttributeValue } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { type SetOptional } from 'type-fest';

import { fromUnixTimestamp, toUnixTimestamp } from '../../helpers/date.helper';
import { getEnvVariableOrFail } from '../../helpers/env.helper';
import { getPresignedShareUrl } from '../../helpers/s3.helper';
import { BaseEntity } from '../base/base.entity';
import { type PrimaryKey } from '../common/types/entity.type';

import { type DocumentBatchStatus } from './enum';
import {
  type DocumentBatch,
  type DocumentBatchError,
  type DocumentBatchGeneratedDocument,
  type StoredDocumentBatch,
} from './type';

export class DocumentBatchEntity extends BaseEntity {
  constructor({
    createdAt = new Date(),
    errors = [],
    expiresAt,
    generatedDocuments = [],
    id = randomUUID(),
    status,
    userId,
  }: SetOptional<DocumentBatch, 'createdAt' | 'errors' | 'generatedDocuments' | 'id'>) {
    const primaryKey = DocumentBatchEntity.getPrimaryKey({ id, userId });

    super({ createdAt, expiresAt, primaryKey });

    this.id = id;
    this.userId = userId;
    this.status = status;
    this.errors = errors;
    this.generatedDocuments = generatedDocuments;
  }

  public static pkPrefix = 'DOCUMENT_BATCH#';

  public id: string;

  public userId: string;

  public status: DocumentBatchStatus;

  public errors: DocumentBatchError[];

  public generatedDocuments: DocumentBatchGeneratedDocument[];

  declare public expiresAt: Date;

  public static updatableFields: Set<string> = new Set<keyof DocumentBatch>([
    'errors',
    'generatedDocuments',
    'status',
  ]);

  toDynamoItem(): Record<string, AttributeValue> {
    const item: StoredDocumentBatch = {
      ...this.primaryKey,
      createdAt: toUnixTimestamp(this.createdAt),
      errors: this.errors,
      expiresAt: toUnixTimestamp(this.expiresAt),
      generatedDocuments: this.generatedDocuments,
      id: this.id,
      status: this.status,
      userId: this.userId,
    };

    const result = marshall(item, {
      removeUndefinedValues: true,
    });

    return result;
  }

  static fromDynamoItem(item: Record<string, AttributeValue>): DocumentBatchEntity {
    const rawItem = unmarshall(item) as StoredDocumentBatch;

    return new DocumentBatchEntity({
      ...rawItem,
      createdAt: fromUnixTimestamp(rawItem.createdAt),
      expiresAt: fromUnixTimestamp(rawItem.expiresAt),
    });
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

  public async toPublicJson() {
    const bucket = getEnvVariableOrFail('S3_BUCKET');
    const urlExpirationSeconds = Number(getEnvVariableOrFail('PRESIGNED_URL_EXPIRATION_SECONDS'));

    const generatedDocuments = await Promise.all(
      this.generatedDocuments.map(async ({ ref, s3Key }) => {
        const url = await getPresignedShareUrl({
          bucket,
          expiresInSeconds: urlExpirationSeconds,
          key: s3Key,
        });

        return {
          ref,
          url,
        };
      }),
    );

    return {
      errors: this.errors,
      generatedDocuments,
      id: this.id,
      status: this.status,
    };
  }
}
