import { type DynamoDBStreamEvent, type DynamoDBRecord } from 'aws-lambda';
import { type PartialDeep } from 'type-fest';

import { DynamoDbRecordMockFactory } from './dynamo-db-record.mock-factory';

export class DynamoDbStreamEventMockFactory {
  create(
    overrides: PartialDeep<DynamoDBStreamEvent, { recurseIntoArrays: true }> = {},
  ): DynamoDBStreamEvent {
    const recordMockFactory = new DynamoDbRecordMockFactory();

    let records: DynamoDBRecord[] = [recordMockFactory.create()];
    if (overrides.Records) {
      records = overrides.Records.map((recordOverride) => recordMockFactory.create(recordOverride));
    }

    return {
      Records: records,
      ...overrides,
    } satisfies PartialDeep<
      DynamoDBStreamEvent,
      { recurseIntoArrays: true }
    > as DynamoDBStreamEvent;
  }
}
