import { SendMessageCommand, SQSClient, type SQSClientConfig } from '@aws-sdk/client-sqs';

import { logger } from './logger.helper';
import { captureAwsClient } from './tracing.helper';

let sqsClient: SQSClient | undefined;

export function getSqsClient() {
  if (!sqsClient) {
    const config: SQSClientConfig = {};
    if (process.env.SQS_ENDPOINT) {
      config.endpoint = process.env.SQS_ENDPOINT;
    }
    sqsClient = captureAwsClient(new SQSClient(config));
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
