import { randomUUID } from 'node:crypto';

import * as sqsHelper from '../../../helpers/sqs.helper';

import { scheduleObjectDeletion } from './schedule-deletion.helper';

afterEach(() => {
  jest.clearAllMocks();
});

describe('scheduleObjectDeletion', () => {
  it('should schedule object deletion', async () => {
    const key = randomUUID();
    const deleteInSeconds = 60;
    const mockedQueueUrl = 'https://mocked.example.com/path';
    process.env.DELETE_EXPIRED_S3_OBJECTS_QUEUE_URL = mockedQueueUrl;

    const sendSqsMessageSpy = jest.spyOn(sqsHelper, 'sendSqsMessage').mockResolvedValue();

    await scheduleObjectDeletion({
      key,
      deleteInSeconds,
    });

    expect(sendSqsMessageSpy).toHaveBeenCalledWith({
      body: key,
      delaySeconds: deleteInSeconds,
      queueUrl: mockedQueueUrl,
    });
  });
});
