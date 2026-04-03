import { Duration } from 'aws-cdk-lib';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { Queue } from 'aws-cdk-lib/aws-sqs';
import { type Construct } from 'constructs';

import { type createLambdas } from './lambdas';

export function createSqsQueues({ scope, stackId }: { scope: Construct; stackId: string }) {
  const deadLetterQueue = new Queue(scope, 'dead-letter-queue', {
    enforceSSL: true,
    queueName: `${stackId}-dead-letter-queue`,
    receiveMessageWaitTime: Duration.seconds(20),
  });

  const deleteExpiredS3ObjectsQueue = new Queue(scope, 'delete-expired-s3-objects-queue', {
    deadLetterQueue: {
      maxReceiveCount: 3,
      queue: deadLetterQueue,
    },
    deliveryDelay: Duration.minutes(15),
    enforceSSL: true,
    queueName: `${stackId}-delete-expired-s3-objects-queue`,
    receiveMessageWaitTime: Duration.seconds(20),
  });

  return {
    deadLetterQueue,
    deleteExpiredS3ObjectsQueue,
  };
}

export function createSqsEventSources({
  lambdas,
  sqsQueues,
}: {
  lambdas: ReturnType<typeof createLambdas>;
  sqsQueues: ReturnType<typeof createSqsQueues>;
}) {
  const deleteExpiredS3ObjectsEventSource = new SqsEventSource(
    sqsQueues.deleteExpiredS3ObjectsQueue,
  );

  lambdas.deleteExpiredS3Objects.addEventSource(deleteExpiredS3ObjectsEventSource);
}
