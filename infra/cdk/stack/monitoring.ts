import { Duration } from 'aws-cdk-lib';
import { Alarm, ComparisonOperator, TreatMissingData } from 'aws-cdk-lib/aws-cloudwatch';
import { type Construct } from 'constructs';

import { type createStateMachines } from './sfn';
import { type createSqsQueues } from './sqs';

export function createAlarms({
  scope,
  sqsQueues,
  stateMachines,
}: {
  scope: Construct;
  sqsQueues: ReturnType<typeof createSqsQueues>;
  stateMachines: ReturnType<typeof createStateMachines>;
}) {
  new Alarm(scope, 'dead-letter-queue-messages-alarm', {
    alarmDescription:
      'Messages in the DLQ indicate a persistent failure after all retries have been exhausted.',
    comparisonOperator: ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
    evaluationPeriods: 1,
    metric: sqsQueues.deadLetterQueue.metricApproximateNumberOfMessagesVisible({
      period: Duration.minutes(1),
      statistic: 'Maximum',
    }),
    threshold: 1,
    treatMissingData: TreatMissingData.NOT_BREACHING,
  });

  new Alarm(scope, 'document-batch-executions-failed-alarm', {
    alarmDescription: 'Document batch generation state machine executions are failing.',
    comparisonOperator: ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
    evaluationPeriods: 1,
    metric: stateMachines.documentBatchGeneration.metricFailed({
      period: Duration.minutes(5),
    }),
    threshold: 1,
    treatMissingData: TreatMissingData.NOT_BREACHING,
  });

  new Alarm(scope, 'document-batch-executions-throttled-alarm', {
    alarmDescription:
      'Document batch generation state machine executions are being throttled - batch requests are silently dropped before any Lambda is invoked.',
    comparisonOperator: ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
    evaluationPeriods: 1,
    metric: stateMachines.documentBatchGeneration.metricThrottled({
      period: Duration.minutes(5),
    }),
    threshold: 1,
    treatMissingData: TreatMissingData.NOT_BREACHING,
  });
}
