import { randomUUID } from 'node:crypto';

import { type SQSRecord } from 'aws-lambda';
import { type PartialDeep } from 'type-fest';

export class SqsRecordMockFactory {
  create(overrides: PartialDeep<SQSRecord, { recurseIntoArrays: true }> = {}): SQSRecord {
    return {
      body: randomUUID(),
      ...overrides,
    } satisfies PartialDeep<SQSRecord, { recurseIntoArrays: true }> as SQSRecord;
  }
}
