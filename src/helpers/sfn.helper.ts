import { SFNClient, StartExecutionCommand } from '@aws-sdk/client-sfn';

import { logger } from './logger.helper';

let sfnClient: SFNClient | undefined;

export function getSfnClient() {
  if (!sfnClient) {
    sfnClient = new SFNClient();
  }

  return sfnClient;
}

export async function startExecution({
  stateMachineArn,
  name,
  input,
}: {
  stateMachineArn: string;
  name: string;
  input: Record<string, unknown>;
}) {
  logger.info({ stateMachineArn, name }, 'stateMachineHelper.startExecution');

  const command = new StartExecutionCommand({
    stateMachineArn,
    name,
    input: JSON.stringify(input),
  });

  const result = await getSfnClient().send(command);

  logger.info(result, 'stateMachineHelper.startExecution.result');
  return result;
}
