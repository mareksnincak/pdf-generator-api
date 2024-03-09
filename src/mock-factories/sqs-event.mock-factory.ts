import { type SQSRecord, type SQSEvent } from 'aws-lambda';
import { type PartialDeep } from 'type-fest';

import { SqsRecordMockFactory } from './sqs-record.mock-factory';

export class SqsEventMockFactory {
  create(overrides: PartialDeep<SQSEvent, { recurseIntoArrays: true }> = {}): SQSEvent {
    const recordMockFactory = new SqsRecordMockFactory();

    let records: SQSRecord[] = [recordMockFactory.create()];
    if (overrides.Records) {
      records = overrides.Records.map((recordOverride) => recordMockFactory.create(recordOverride));
    }

    return {
      Records: records,
      ...overrides,
    } satisfies PartialDeep<SQSEvent, { recurseIntoArrays: true }> as SQSEvent;
  }
}
