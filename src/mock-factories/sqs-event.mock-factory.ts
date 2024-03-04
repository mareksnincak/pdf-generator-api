import { type SQSRecord, type SQSEvent } from 'aws-lambda';
import { type PartialDeep } from 'type-fest';

import { SqsRecordMockFactory } from './sqs-record.mock-factory';

export class SqsEventMockFactory {
  create(overrides: PartialDeep<SQSEvent, { recurseIntoArrays: true }> = {}): SQSEvent {
    let records: SQSRecord[] = [new SqsRecordMockFactory().create()];
    if (overrides.Records) {
      records = overrides.Records.map((recordOverride) =>
        new SqsRecordMockFactory().create(recordOverride),
      );
    }

    return {
      Records: records,
      ...overrides,
    } satisfies PartialDeep<SQSEvent, { recurseIntoArrays: true }> as SQSEvent;
  }
}
