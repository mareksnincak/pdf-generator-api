import type { AttributeValue } from '@aws-sdk/client-dynamodb';
import { type PrimaryKey } from '../common/types/entity.type';

export abstract class BaseEntity {
  private readonly PK: string;

  private readonly SK: string;

  constructor({ PK, SK }: PrimaryKey) {
    this.PK = PK;
    this.SK = SK;
  }

  public get primaryKey(): PrimaryKey {
    return {
      PK: this.PK,
      SK: this.SK,
    };
  }

  static fromDynamoDbItem(
    _rawItem: Record<string, AttributeValue>,
  ): BaseEntity | Promise<BaseEntity> {
    throw new Error('BaseEntity.fromDynamoDbItem.notImplemented');
  }

  abstract toDynamoDbItem():
    | Record<string, AttributeValue>
    | Promise<Record<string, AttributeValue>>;
}
