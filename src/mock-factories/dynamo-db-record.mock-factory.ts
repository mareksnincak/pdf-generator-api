import { type DynamoDBRecord } from 'aws-lambda';
import { type PartialDeep } from 'type-fest';

export class DynamoDbRecordMockFactory {
  create(overrides: PartialDeep<DynamoDBRecord> = {}): DynamoDBRecord {
    return {
      ...overrides,
    } satisfies PartialDeep<DynamoDBRecord> as DynamoDBRecord;
  }
}
