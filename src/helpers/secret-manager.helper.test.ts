import { GetSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager';

import { getSecret } from './secret-manager.helper';

afterEach(() => {
  jest.resetAllMocks();
});

describe('getSecret', () => {
  it('should return secret', async () => {
    const secretId = 'sample-secret';
    const secretValue = 'sample-value';

    const secretManagerClientSpy = jest
      .spyOn(SecretsManagerClient.prototype, 'send')
      .mockImplementation(() => ({ SecretString: secretValue }));

    const secret = await getSecret({ secretId });

    expect(secret).toEqual(secretValue);

    const secretManagerClientArgs = secretManagerClientSpy.mock.calls[0]?.[0];
    expect(secretManagerClientArgs).toBeInstanceOf(GetSecretValueCommand);
    expect(secretManagerClientArgs.input).toEqual({
      SecretId: secretId,
    });
  });

  it('should throw error when value is undefined', async () => {
    const secretId = 'sample-secret';
    const secretValue = undefined;

    jest
      .spyOn(SecretsManagerClient.prototype, 'send')
      .mockImplementation(() => ({ SecretString: secretValue }));

    try {
      await getSecret({ secretId });
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toEqual('secretManagerHelper.getSecret.undefinedValue');
    }
  });
});
