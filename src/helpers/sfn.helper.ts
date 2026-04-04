import { SFNClient, StartExecutionCommand } from '@aws-sdk/client-sfn';

import { logger } from './logger.helper';
import { captureAwsClient } from './tracing.helper';

let sfnClient: SFNClient | undefined;

export function getSfnClient() {
  if (!sfnClient) {
    sfnClient = captureAwsClient(new SFNClient());
  }

  return sfnClient;
}

export async function startExecution({
  input,
  name,
  stateMachineArn,
}: {
  input: Record<string, unknown>;
  name: string;
  stateMachineArn: string;
}) {
  logger.info({ name, stateMachineArn }, 'stateMachineHelper.startExecution');

  const command = new StartExecutionCommand({
    input: JSON.stringify(input),
    name,
    stateMachineArn,
  });

  const result = await getSfnClient().send(command);

  logger.info(result, 'stateMachineHelper.startExecution.result');
  return result;
}
