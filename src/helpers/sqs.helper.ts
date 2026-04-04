import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs';

import { logger } from './logger.helper';
import { captureAwsClient } from './tracing.helper';

let sqsClient: SQSClient | undefined;

export function getSqsClient() {
  if (!sqsClient) {
    sqsClient = captureAwsClient(new SQSClient());
  }

  return sqsClient;
}

export async function sendSqsMessage(params: {
  body: string;
  delaySeconds?: number;
  queueUrl: string;
}) {
  logger.info(params, 'sqsHelper.sendMessage');
  const { body, delaySeconds, queueUrl } = params;

  await getSqsClient().send(
    new SendMessageCommand({
      DelaySeconds: delaySeconds,
      MessageBody: body,
      QueueUrl: queueUrl,
    }),
  );

  logger.info('sqsHelper.sendMessage.success');
}
