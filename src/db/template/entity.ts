import { randomUUID } from 'node:crypto';

import type { AttributeValue } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { type SetOptional } from 'type-fest';

import { ErrorMessage } from '../../enums/error.enum';
import { ConflictError } from '../../errors/conflict.error';
import { fromUnixTimestamp, toUnixTimestamp } from '../../helpers/date.helper';
import { getEnvVariableOrFail } from '../../helpers/env.helper';
import { getObject, getPresignedShareUrl } from '../../helpers/s3.helper';
import { BaseEntity } from '../base/base.entity';
import { type Gsi1Key, type PrimaryKey } from '../common/types/entity.type';

import { MalwareScanStatus, type TemplateType } from './enum';
import { type StoredTemplate, type Template } from './type';

export class TemplateEntity extends BaseEntity {
  constructor({
    createdAt = new Date(),
    id = randomUUID(),
    malwareScanStatus,
    name,
    s3Key,
    type,
    userId,
  }: SetOptional<Template, 'createdAt' | 'id'>) {
    const primaryKey = TemplateEntity.getPrimaryKey({ id, userId });
    const gsi1Key = TemplateEntity.getGsi1Key({ name, userId });

    super({ createdAt, gsi1Key, primaryKey });

    this.id = id;
    this.name = name;
    this.type = type;
    this.s3Key = s3Key;
    this.malwareScanStatus = malwareScanStatus;
    this.userId = userId;
  }

  public static pkPrefix = 'TEMPLATE#';

  public id: string;

  public name: string;

  public type: TemplateType;

  public s3Key: string;

  public malwareScanStatus: MalwareScanStatus;

  public userId: string;

  toDynamoItem(): Record<string, AttributeValue> {
    const item: StoredTemplate = {
      ...this.primaryKey,
      ...this.gsi1Key,
      createdAt: toUnixTimestamp(this.createdAt),
      id: this.id,
      malwareScanStatus: this.malwareScanStatus,
      name: this.name,
      s3Key: this.s3Key,
      type: this.type,
      userId: this.userId,
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

  public static getGsi1Key({ name, userId }: { name: string; userId: string }): Gsi1Key {
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
      expiresInSeconds: urlExpirationSeconds,
      key: this.s3Key,
    });

    return {
      ...this.toPublicJson(),
      dataUrl,
    };
  }

  public async getData() {
    if (this.malwareScanStatus === MalwareScanStatus.infected) {
      throw new ConflictError({ message: ErrorMessage.templateInfected });
    }

    const bucket = getEnvVariableOrFail('S3_BUCKET');
    const data = await getObject({ bucket, key: this.s3Key });
    return data;
  }
}
