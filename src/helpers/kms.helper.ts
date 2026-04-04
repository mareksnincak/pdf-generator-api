import { DecryptCommand, EncryptCommand, KMSClient } from '@aws-sdk/client-kms';

import { captureAwsClient } from './tracing.helper';

let kmsClient: KMSClient | undefined;

export function getKmsClient() {
  if (!kmsClient) {
    kmsClient = captureAwsClient(new KMSClient());
  }

  return kmsClient;
}

export async function encrypt({ data, keyId }: { data: Buffer; keyId: string }) {
  const { CiphertextBlob } = await getKmsClient().send(
    new EncryptCommand({
      KeyId: keyId,
      Plaintext: data,
    }),
  );

  if (!CiphertextBlob) {
    throw new Error('kmsHelper.encrypt.missingEncryptedValue');
  }

  return Buffer.from(CiphertextBlob);
}

export async function decrypt({ data }: { data: Buffer }) {
  const { Plaintext } = await getKmsClient().send(
    new DecryptCommand({
      CiphertextBlob: data,
    }),
  );

  if (!Plaintext) {
    throw new Error('kmsHelper.decrypt.missingDecryptedValue');
  }

  return Buffer.from(Plaintext);
}
