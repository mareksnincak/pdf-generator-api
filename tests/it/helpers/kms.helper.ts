import {
  CreateAliasCommand,
  CreateKeyCommand,
  KMSClient,
  ListAliasesCommand,
} from '@aws-sdk/client-kms';

function getKmsClient() {
  return new KMSClient({
    credentials: { accessKeyId: 'local', secretAccessKey: 'local' },
    endpoint: process.env.KMS_ENDPOINT,
    region: 'eu-central-1',
  });
}

export async function createKmsKey(aliasName: string) {
  if (!aliasName.startsWith('alias/')) {
    throw new Error("Alias must start with 'alias/'");
  }

  const kms = getKmsClient();
  const aliases = await kms.send(new ListAliasesCommand());

  const existingAlias = aliases.Aliases?.find((alias) => alias.AliasName === aliasName);

  if (existingAlias?.TargetKeyId) {
    return existingAlias.TargetKeyId;
  }

  const key = await kms.send(new CreateKeyCommand());
  const keyId = key.KeyMetadata?.KeyId;

  if (!keyId) {
    throw new Error('kmsTestHelper.createKmsKey.missingKeyId');
  }

  await kms.send(
    new CreateAliasCommand({
      AliasName: aliasName,
      TargetKeyId: keyId,
    }),
  );

  return keyId;
}
