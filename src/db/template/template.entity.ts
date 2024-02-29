import { randomUUID } from 'node:crypto';

import type { AttributeValue } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { type Optional } from 'utility-types';

import { BaseEntity } from '../base/base.entity';

import { type TemplateType } from './template.enum';
import { type Template, type StoredTemplate } from './template.type';

export class TemplateEntity extends BaseEntity {
  constructor({ id = randomUUID(), name, type, s3Key }: Optional<Template, 'id'>) {
    super({
      PK: `TEMPLATE#${id}`,
      SK: '#',
    });

    this.id = id;
    this.name = name;
    this.type = type;
    this.s3Key = s3Key;
  }

  public id: string;

  public name: string;

  public type: TemplateType;

  public s3Key: string;

  async toDynamoItem(): Promise<Record<string, AttributeValue>> {
    const item: StoredTemplate = {
      ...this.primaryKey,
      id: this.id,
      name: this.name,
      type: this.type,
      s3Key: this.s3Key,
    };

    const result = marshall(item, {
      removeUndefinedValues: true,
    });

    return result;
  }

  static async fromDynamoItem(item: Record<string, AttributeValue>): Promise<TemplateEntity> {
    const rawTemplate = unmarshall(item) as StoredTemplate;

    return new TemplateEntity(rawTemplate);
  }

  public static getDynamoPartitionKey({ id }: { id: string }) {
    return marshall({
      PK: `TEMPLATE#${id}`,
      SK: '#',
    });
  }
}
