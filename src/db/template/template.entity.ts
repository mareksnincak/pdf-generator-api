import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

import { BaseEntity } from '../base/base.entity';

import type { AttributeValue } from '@aws-sdk/client-dynamodb';
import { type Template, type StoredTemplate } from './template.type';
import { type TemplateType } from './template.enum';
import { randomUUID } from 'crypto';

export class TemplateEntity extends BaseEntity {
  constructor({ id, name, type }: Omit<Template, 'id'> & { id?: string }) {
    super({
      PK: `TEMPLATE#${id}`,
      SK: '#',
    });

    this.id = id ?? randomUUID();
    this.name = name;
    this.type = type;
  }

  public id: string;

  public name: string;

  public type: TemplateType;

  async toDynamoDbItem(): Promise<Record<string, AttributeValue>> {
    const item: StoredTemplate = {
      ...this.primaryKey,
      id: this.id,
      name: this.name,
      type: this.type,
    };

    const result = marshall(item, {
      removeUndefinedValues: true,
    });

    return result;
  }

  static async fromDynamoDbItem(item: Record<string, AttributeValue>): Promise<TemplateEntity> {
    const rawTemplate = unmarshall(item) as StoredTemplate;

    return new TemplateEntity(rawTemplate);
  }
}
