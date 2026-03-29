import { type DynamoDBRecord } from 'aws-lambda';
import { type PartialDeep } from 'type-fest';

export class DynamoDbRecordMockFactory {
  create(overrides: PartialDeep<DynamoDBRecord, { recurseIntoArrays: true }> = {}): DynamoDBRecord {
    return {
      ...overrides,
    } satisfies PartialDeep<DynamoDBRecord, { recurseIntoArrays: true }> as DynamoDBRecord;
  }
}
