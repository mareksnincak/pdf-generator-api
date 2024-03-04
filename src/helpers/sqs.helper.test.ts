import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';

import { sendSqsMessage } from './sqs.helper';

afterEach(() => {
  jest.resetAllMocks();
});

describe('sendSqsMessage', () => {
  it('should send sqs message', async () => {
    const body = 'sample-body';
    const queueUrl = 'sample-queue-url';
    const delaySeconds = 30;

    const sqsClientSpy = jest.spyOn(SQSClient.prototype, 'send').mockImplementation();

    await sendSqsMessage({
      body,
      queueUrl,
      delaySeconds,
    });

    const sqsClientArgs = sqsClientSpy.mock.calls[0]?.[0];
    expect(sqsClientArgs).toBeInstanceOf(SendMessageCommand);
    expect(sqsClientArgs.input).toEqual({
      MessageBody: body,
      QueueUrl: queueUrl,
      DelaySeconds: delaySeconds,
    });
  });
});
