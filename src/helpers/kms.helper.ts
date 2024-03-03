import { DecryptCommand, EncryptCommand, KMSClient } from '@aws-sdk/client-kms';

let kmsClient: KMSClient | undefined;

export function getKmsClient() {
  if (!kmsClient) {
    kmsClient = new KMSClient();
  }

  return kmsClient;
}

export async function encrypt({ keyId, data }: { keyId: string; data: Buffer }) {
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
