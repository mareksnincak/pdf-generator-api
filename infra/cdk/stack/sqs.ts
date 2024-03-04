import { Duration } from 'aws-cdk-lib';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { Queue } from 'aws-cdk-lib/aws-sqs';
import { type Construct } from 'constructs';

import { type createLambdas } from './lambdas';

export function createSqsQueues({ scope, stackId }: { scope: Construct; stackId: string }) {
  const deleteExpiredS3ObjectsQueue = new Queue(scope, 'delete-expired-s3-objects-queue', {
    queueName: `${stackId}-delete-expired-s3-objects-queue`,
    deliveryDelay: Duration.minutes(15),
    receiveMessageWaitTime: Duration.seconds(20),
    enforceSSL: true,
  });

  return {
    deleteExpiredS3ObjectsQueue,
  };
}

export function createSqsEventSources({
  sqsQueues,
  lambdas,
}: {
  sqsQueues: ReturnType<typeof createSqsQueues>;
  lambdas: ReturnType<typeof createLambdas>;
}) {
  const deleteExpiredS3ObjectsEventSource = new SqsEventSource(
    sqsQueues.deleteExpiredS3ObjectsQueue,
  );

  lambdas.deleteExpiredS3Objects.addEventSource(deleteExpiredS3ObjectsEventSource);
}
