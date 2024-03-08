import { randomUUID } from 'node:crypto';

import type { AttributeValue } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { type SetOptional } from 'type-fest';

import { fromUnixTimestamp, toUnixTimestamp } from '../../helpers/date.helper';
import { getEnvVariableOrFail } from '../../helpers/env.helper';
import { getObject, getPresignedShareUrl } from '../../helpers/s3.helper';
import { BaseEntity } from '../base/base.entity';
import { type Gsi1Key, type PrimaryKey } from '../common/types/entity.type';

import { type TemplateType } from './template.enum';
import { type Template, type StoredTemplate } from './template.type';

export class TemplateEntity extends BaseEntity {
  constructor({
    id = randomUUID(),
    name,
    type,
    s3Key,
    userId,
    createdAt = new Date(),
  }: SetOptional<Template, 'id' | 'createdAt'>) {
    const primaryKey = TemplateEntity.getPrimaryKey({ id, userId });
    const gsi1Key = TemplateEntity.getGsi1Key({ userId, name });

    super({ primaryKey, gsi1Key, createdAt });

    this.id = id;
    this.name = name;
    this.type = type;
    this.s3Key = s3Key;
    this.userId = userId;
  }

  public id: string;

  public name: string;

  public type: TemplateType;

  public s3Key: string;

  public userId: string;

  async toDynamoItem(): Promise<Record<string, AttributeValue>> {
    const item: StoredTemplate = {
      ...this.primaryKey,
      ...this.gsi1Key,
      id: this.id,
      name: this.name,
      type: this.type,
      s3Key: this.s3Key,
      userId: this.userId,
      createdAt: toUnixTimestamp(this.createdAt),
    };

    const result = marshall(item, {
      removeUndefinedValues: true,
    });

    return result;
  }

  static fromDynamoItem(item: Record<string, AttributeValue>): TemplateEntity {
    const rawItem = unmarshall(item) as StoredTemplate;

    return new TemplateEntity({
      ...rawItem,
      createdAt: fromUnixTimestamp(rawItem.createdAt),
    });
  }

  public static getPrimaryKey({ id, userId }: { id: string; userId: string }): PrimaryKey {
    return {
      PK: `TEMPLATE#USER#${userId}#ID#${id}`,
      SK: '#',
    };
  }

  public static getDynamoPrimaryKey({ id, userId }: { id: string; userId: string }) {
    return marshall(this.getPrimaryKey({ id, userId }));
  }

  public static getGsi1PartitionKey({ userId }: { userId: string }) {
    return `TEMPLATE#USER#${userId}`;
  }

  public static getGsi1Key({ userId, name }: { userId: string; name: string }): Gsi1Key {
    return {
      GSI1PK: TemplateEntity.getGsi1PartitionKey({ userId }),
      GSI1SK: `NAME#${name}`,
    };
  }

  public toPublicJson() {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
    };
  }

  public async toPublicJsonWithDataUrl() {
    const bucket = getEnvVariableOrFail('S3_BUCKET');
    const urlExpirationSeconds = Number(getEnvVariableOrFail('PRESIGNED_URL_EXPIRATION_SECONDS'));

    const dataUrl = await getPresignedShareUrl({
      bucket,
      key: this.s3Key,
      expiresInSeconds: urlExpirationSeconds,
    });

    return {
      ...this.toPublicJson(),
      dataUrl,
    };
  }

  public async getData() {
    const bucket = getEnvVariableOrFail('S3_BUCKET');
    const data = await getObject({ bucket, key: this.s3Key });
    return data;
  }
}
