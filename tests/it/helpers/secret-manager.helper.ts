import { CreateSecretCommand } from '@aws-sdk/client-secrets-manager';

import { getSecretManagerClient } from '../../../src/helpers/secret-manager.helper';

export async function createSecret(secretName: string, secretValue: string): Promise<void> {
  const client = getSecretManagerClient();

  await client.send(
    new CreateSecretCommand({
      Name: secretName,
      SecretString: secretValue,
    }),
  );
}
