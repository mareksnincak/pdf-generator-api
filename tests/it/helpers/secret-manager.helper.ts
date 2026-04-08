import { CreateSecretCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager';

function getSecretsManagerClient() {
  if (!process.env.SECRETS_MANAGER_ENDPOINT) {
    throw new Error('secretManagerTestHelper.getSecretsManagerClient.missingEndpoint');
  }

  return new SecretsManagerClient({
    credentials: { accessKeyId: 'local', secretAccessKey: 'local' },
    endpoint: process.env.SECRETS_MANAGER_ENDPOINT,
    region: 'eu-central-1',
  });
}

export async function createSecret(secretName: string, secretValue: string): Promise<void> {
  const client = getSecretsManagerClient();

  await client.send(
    new CreateSecretCommand({
      Name: secretName,
      SecretString: secretValue,
    }),
  );
}
