import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs';

import { sendSqsMessage } from './sqs.helper';

afterEach(() => {
  jest.clearAllMocks();
});

describe('sendSqsMessage', () => {
  it('should send sqs message', async () => {
    const body = 'sample-body';
    const queueUrl = 'sample-queue-url';
    const delaySeconds = 30;

    const sqsClientSpy = jest.spyOn(SQSClient.prototype, 'send').mockImplementation();

    await sendSqsMessage({
      body,
      delaySeconds,
      queueUrl,
    });

    const sqsClientArgs = sqsClientSpy.mock.calls[0]?.[0];
    expect(sqsClientArgs).toBeInstanceOf(SendMessageCommand);
    expect(sqsClientArgs.input).toEqual({
      DelaySeconds: delaySeconds,
      MessageBody: body,
      QueueUrl: queueUrl,
    });
  });
});
