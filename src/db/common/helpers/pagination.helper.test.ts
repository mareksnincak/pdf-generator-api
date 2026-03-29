import { randomUUID } from 'node:crypto';

import { ErrorMessage } from '../../../enums/error.enum';
import { BadRequestError } from '../../../errors/bad-request.error';
import * as kmsHelper from '../../../helpers/kms.helper';
import { mockLogger } from '../../../helpers/test.helper';

import { decryptPaginationToken, encryptPaginationToken } from './pagination.helper';

afterEach(() => {
  jest.clearAllMocks();
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
      paginationToken,
      userId,
    });

    expect(Buffer.from(result ?? '', 'base64url').toString()).toEqual(encryptedValue);
  });

  it('should return undefined when lastEvaluatedKey is undefined', async () => {
    const userId = randomUUID();
    const paginationToken = undefined;

    const result = await encryptPaginationToken({
      paginationToken,
      userId,
    });

    expect(result).toEqual(undefined);
  });
});

describe('decryptPaginationToken', () => {
  it('should decrypt pagination token', async () => {
    const userId = randomUUID();
    const paginationToken = 'c2FtcGxlLWVuY3J5cHRlZC12YWx1ZQ';

    jest
      .spyOn(kmsHelper, 'decrypt')
      .mockResolvedValue(Buffer.from(JSON.stringify({ token: { PK: 'sample-pk' }, userId })));

    const result = await decryptPaginationToken({
      paginationToken,
      userId,
    });

    expect(result).toEqual({ PK: { S: 'sample-pk' } });
  });

  it('should return undefined when paginationToken is undefined', async () => {
    const userId = randomUUID();
    const paginationToken = undefined;

    const result = await decryptPaginationToken({
      paginationToken,
      userId,
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
      await decryptPaginationToken({ paginationToken, userId });
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
        Buffer.from(JSON.stringify({ token: { PK: 'sample-pk' }, userId: 'other-user-id' })),
      );

    try {
      await decryptPaginationToken({ paginationToken, userId });
      expect(true).toEqual(false);
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestError);
      expect((error as BadRequestError).message).toEqual(ErrorMessage.invalidPaginationToken);
    }
  });
});
