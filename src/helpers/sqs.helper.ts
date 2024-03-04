import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';

import { logger } from './logger.helper';

let sqsClient: SQSClient | undefined;

export function getSqsClient() {
  if (!sqsClient) {
    sqsClient = new SQSClient();
  }

  return sqsClient;
}

// TODO tests
export async function sendSqsMessage(params: {
  body: string;
  queueUrl: string;
  delaySeconds?: number;
}) {
  logger.info(params, 'sqsHelper.sendMessage');
  const { body, queueUrl, delaySeconds } = params;

  await getSqsClient().send(
    new SendMessageCommand({
      MessageBody: body,
      QueueUrl: queueUrl,
      DelaySeconds: delaySeconds,
    }),
  );

  logger.info('sqsHelper.sendMessage.success');
}
