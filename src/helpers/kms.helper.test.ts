import { DecryptCommand, EncryptCommand, KMSClient } from '@aws-sdk/client-kms';

import { decrypt, encrypt } from './kms.helper';

afterEach(() => {
  jest.resetAllMocks();
});

describe('encrypt', () => {
  it('should encrypt data', async () => {
    const encryptedValue = Buffer.from('sample-encrypted-value');
    const kmsClientSpy = jest.spyOn(KMSClient.prototype, 'send').mockImplementation(() => ({
      CiphertextBlob: encryptedValue,
    }));

    const keyId = 'sample-key-id';
    const data = Buffer.from('sample-plaintext-value');
    const result = await encrypt({ data, keyId });

    expect(result.toString()).toEqual(encryptedValue.toString());

    const kmsClientArgs = kmsClientSpy.mock.calls[0]?.[0];
    expect(kmsClientArgs).toBeInstanceOf(EncryptCommand);
    expect(kmsClientArgs.input).toEqual({
      KeyId: keyId,
      Plaintext: data,
    });
  });
});

describe('decrypt', () => {
  it('should decrypt data', async () => {
    const plaintextValue = Buffer.from('sample-plaintext-value');
    const kmsClientSpy = jest.spyOn(KMSClient.prototype, 'send').mockImplementation(() => ({
      Plaintext: plaintextValue,
    }));

    const data = Buffer.from('sample-encrypted-value');
    const result = await decrypt({ data });

    expect(result.toString()).toEqual(plaintextValue.toString());

    const kmsClientArgs = kmsClientSpy.mock.calls[0]?.[0];
    expect(kmsClientArgs).toBeInstanceOf(DecryptCommand);
    expect(kmsClientArgs.input).toEqual({
      CiphertextBlob: data,
    });
  });
});
