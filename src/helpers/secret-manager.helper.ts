import { GetSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager';

import { logger } from './logger.helper';

export const secretManagerClient = new SecretsManagerClient({});

// TODO test
export async function getSecret({ secretId }: { secretId: string }): Promise<string> {
  logger.info({ secretId }, 'secretManagerHelper.getSecret.input');

  const command = new GetSecretValueCommand({ SecretId: secretId });
  const response = await secretManagerClient.send(command);

  const value = response.SecretString;
  if (value === undefined) {
    const errorMsg = 'secretManagerHelper.getSecret.undefinedValue';
    logger.error(errorMsg);
    throw new Error(errorMsg);
  }

  logger.info('secretManagerHelper.getSecret.result');
  return value;
}
