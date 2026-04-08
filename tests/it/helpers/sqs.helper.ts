import {
  CreateQueueCommand,
  DeleteQueueCommand,
  QueueDoesNotExist,
  ReceiveMessageCommand,
} from '@aws-sdk/client-sqs';

import { getSqsClient } from '../../../src/helpers/sqs.helper';

export async function refreshSqsQueue(queueUrl: string) {
  const client = getSqsClient();

  try {
    await client.send(new DeleteQueueCommand({ QueueUrl: queueUrl }));
  } catch (error) {
    if (!(error instanceof QueueDoesNotExist)) {
      throw error;
    }
  }

  const queueName = queueUrl.split('/').at(-1)!;
  await client.send(new CreateQueueCommand({ QueueName: queueName }));
}

export async function receiveSqsMessage(queueUrl: string): Promise<string | undefined> {
  const client = getSqsClient();
  const result = await client.send(
    new ReceiveMessageCommand({ MaxNumberOfMessages: 1, QueueUrl: queueUrl, WaitTimeSeconds: 0 }),
  );
  return result.Messages?.[0]?.Body;
}
