import {
  GetSecretValueCommand,
  SecretsManagerClient,
  type SecretsManagerClientConfig,
} from '@aws-sdk/client-secrets-manager';

import { logger } from './logger.helper';

let secretManagerClient: SecretsManagerClient | undefined;

export function getSecretManagerClient() {
  if (!secretManagerClient) {
    const config: SecretsManagerClientConfig = {};
    if (process.env.SECRETS_MANAGER_ENDPOINT) {
      config.endpoint = process.env.SECRETS_MANAGER_ENDPOINT;
    }
    secretManagerClient = new SecretsManagerClient(config);
  }

  return secretManagerClient;
}

export async function getSecret(secretId: string): Promise<string> {
  logger.info({ secretId }, 'secretManagerHelper.getSecret.input');

  const command = new GetSecretValueCommand({ SecretId: secretId });
  const response = await getSecretManagerClient().send(command);

  const value = response.SecretString;
  if (value === undefined) {
    const errorMsg = 'secretManagerHelper.getSecret.undefinedValue';
    logger.error(errorMsg);
    throw new Error(errorMsg);
  }

  logger.info('secretManagerHelper.getSecret.result');
  return value;
}
