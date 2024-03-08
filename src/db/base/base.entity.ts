import type { AttributeValue } from '@aws-sdk/client-dynamodb';

import { type Gsi1Key, type PrimaryKey } from '../common/types/entity.type';

export abstract class BaseEntity {
  private readonly PK: string;

  private readonly SK: string;

  private readonly GSI1PK?: string;

  private readonly GSI1SK?: string;

  public readonly createdAt: Date;

  public readonly expiresAt?: Date;

  constructor({
    primaryKey: { PK, SK },
    gsi1Key: { GSI1PK, GSI1SK } = {},
    createdAt,
    expiresAt,
  }: {
    primaryKey: PrimaryKey;
    gsi1Key?: Gsi1Key;
    createdAt: Date;
    expiresAt?: Date;
  }) {
    this.PK = PK;
    this.SK = SK;
    this.GSI1PK = GSI1PK;
    this.GSI1SK = GSI1SK;
    this.createdAt = createdAt;
    this.expiresAt = expiresAt;
  }

  public get primaryKey(): PrimaryKey {
    return {
      PK: this.PK,
      SK: this.SK,
    };
  }

  public get gsi1Key(): Gsi1Key {
    return {
      GSI1PK: this.GSI1PK,
      GSI1SK: this.GSI1SK,
    };
  }

  static fromDynamoItem(
    _rawItem: Record<string, AttributeValue>,
  ): BaseEntity | Promise<BaseEntity> {
    throw new Error('BaseEntity.fromDynamoDbItem.notImplemented');
  }

  abstract toDynamoItem(): Record<string, AttributeValue> | Promise<Record<string, AttributeValue>>;
}
