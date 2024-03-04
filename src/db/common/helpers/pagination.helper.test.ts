import { randomUUID } from 'node:crypto';

import { ErrorMessage } from '../../../enums/error.enum';
import { BadRequestError } from '../../../errors/bad-request.error';
import * as kmsHelper from '../../../helpers/kms.helper';
import { mockLogger } from '../../../helpers/test.helper';

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

    const userId = randomUUID();
    const paginationToken = { PK: { S: 'sample-pk' } };

    const result = await encryptPaginationToken({
      userId,
      paginationToken,
    });

    expect(Buffer.from(result ?? '', 'base64url').toString()).toEqual(encryptedValue);
  });

  it('should return undefined when lastEvaluatedKey is undefined', async () => {
    const userId = randomUUID();
    const paginationToken = undefined;

    const result = await encryptPaginationToken({
      userId,
      paginationToken,
    });

    expect(result).toEqual(undefined);
  });

  it('should throw error when kms key id is not set', async () => {
    process.env.KMS_KEY_ID = '';
    const userId = randomUUID();
    const paginationToken = { PK: { S: 'sample-pk' } };

    try {
      await encryptPaginationToken({
        userId,
        paginationToken,
      });
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
    const userId = randomUUID();
    const paginationToken = 'c2FtcGxlLWVuY3J5cHRlZC12YWx1ZQ';

    jest
      .spyOn(kmsHelper, 'decrypt')
      .mockResolvedValue(Buffer.from(JSON.stringify({ userId, token: { PK: 'sample-pk' } })));

    const result = await decryptPaginationToken({
      userId,
      paginationToken,
    });

    expect(result).toEqual({ PK: { S: 'sample-pk' } });
  });

  it('should return undefined when paginationToken is undefined', async () => {
    const userId = randomUUID();
    const paginationToken = undefined;

    const result = await decryptPaginationToken({
      userId,
      paginationToken,
    });

    expect(result).toEqual(undefined);
  });

  it('should throw BadRequestError when wrong token is provided', async () => {
    mockLogger();
    const userId = randomUUID();
    const paginationToken = 'sample-invalid-token';

    jest
      .spyOn(kmsHelper, 'decrypt')
      .mockRejectedValue(new Error('commonDb.paginationHelperTest.expectedError'));

    try {
      await decryptPaginationToken({ userId, paginationToken });
      expect(true).toEqual(false);
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestError);
      expect((error as BadRequestError).message).toEqual(ErrorMessage.invalidPaginationToken);
    }
  });

  it("should throw BadRequestError when current userId doesn't match userId from token", async () => {
    mockLogger();
    const userId = randomUUID();
    const paginationToken = 'sample-invalid-token';

    jest
      .spyOn(kmsHelper, 'decrypt')
      .mockResolvedValue(
        Buffer.from(JSON.stringify({ userId: 'other-user-id', token: { PK: 'sample-pk' } })),
      );

    try {
      await decryptPaginationToken({ userId, paginationToken });
      expect(true).toEqual(false);
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestError);
      expect((error as BadRequestError).message).toEqual(ErrorMessage.invalidPaginationToken);
    }
  });
});
