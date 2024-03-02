import { GetParameterCommand, SSMClient } from '@aws-sdk/client-ssm';

import { logger } from './logger.helper';

let ssmClient: SSMClient | undefined;

export function getSsmClient() {
  if (!ssmClient) {
    ssmClient = new SSMClient();
  }

  return ssmClient;
}

export async function getSsmParam(name: string): Promise<string> {
  logger.info(name, 'ssmHelper.getSsmParam.ssmParamName');

  const ssmParam = await getSsmClient().send(
    new GetParameterCommand({
      Name: name,
    }),
  );

  const value = ssmParam.Parameter?.Value;
  if (value === undefined) {
    throw new Error('ssmHelper.getSsmParam.undefinedValue');
  }

  logger.info('ssmHelper.getSsmParam.success');
  return value;
}
