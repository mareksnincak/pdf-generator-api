import { ErrorMessage } from '../../../enums/error.enum';
import { BadRequestError } from '../../../errors/bad-request.error';
import * as kmsHelper from '../../../helpers/kms.helper';

import { decryptPaginationToken, encryptPaginationToken } from './pagination.helper';

afterEach(() => {
  jest.resetAllMocks();
});

describe('encryptPaginationToken', () => {
  beforeEach(() => {
    process.env.KMS_KEY_ID = 'sample-kms-key-id';
  });

  it('should encrypt pagination token', async () => {
    const encryptedValue = 'sample-encrypted-value';
    jest.spyOn(kmsHelper, 'encrypt').mockResolvedValue(Buffer.from(encryptedValue));

    const lastEvaluatedKey = { PK: { S: 'sample-pk' } };

    const result = await encryptPaginationToken(lastEvaluatedKey);

    expect(Buffer.from(result ?? '', 'base64url').toString()).toEqual(encryptedValue);
  });

  it('should return undefined when lastEvaluatedKey is undefined', async () => {
    const lastEvaluatedKey = undefined;

    const result = await encryptPaginationToken(lastEvaluatedKey);

    expect(result).toEqual(undefined);
  });

  it('should throw error when kms key id is not set', async () => {
    process.env.KMS_KEY_ID = '';
    const lastEvaluatedKey = { PK: { S: 'sample-pk' } };

    try {
      await encryptPaginationToken(lastEvaluatedKey);
      expect(true).toEqual(false);
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toEqual(
        'commonDb.paginationHelper.encryptPaginationToken.missingKmsKeyId',
      );
    }
  });
});

describe('decryptPaginationToken', () => {
  it('should decrypt pagination token', async () => {
    jest
      .spyOn(kmsHelper, 'decrypt')
      .mockResolvedValue(Buffer.from(JSON.stringify({ PK: 'sample-pk' })));

    const paginationToken = 'c2FtcGxlLWVuY3J5cHRlZC12YWx1ZQ';

    const result = await decryptPaginationToken(paginationToken);

    expect(result).toEqual({ PK: { S: 'sample-pk' } });
  });

  it('should return undefined when paginationToken is undefined', async () => {
    const paginationToken = undefined;

    const result = await decryptPaginationToken(paginationToken);

    expect(result).toEqual(undefined);
  });

  it('should throw BadRequestError when wrong token is provided', async () => {
    const paginationToken = 'sample-invalid-token';

    try {
      await decryptPaginationToken(paginationToken);
      expect(true).toEqual(false);
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestError);
      expect((error as BadRequestError).message).toEqual(ErrorMessage.invalidPaginationToken);
    }
  });
});
