import { type AttributeValue } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

import { ErrorMessage } from '../../../enums/error.enum';
import { BadRequestError } from '../../../errors/bad-request.error';
import { getEnvVariableOrFail } from '../../../helpers/env.helper';
import { decrypt, encrypt } from '../../../helpers/kms.helper';
import { logger } from '../../../helpers/logger.helper';

type PaginationTokenData = {
  userId: string;
  token: Record<string, unknown>;
};

export async function encryptPaginationToken(params: {
  userId: string;
  paginationToken: Record<string, AttributeValue> | undefined;
}) {
  logger.debug(params, 'commonDb.paginationHelper.encryptPaginationToken.input');
  const { userId, paginationToken } = params;

  if (!paginationToken) {
    return;
  }

  const data: PaginationTokenData = {
    userId,
    token: unmarshall(paginationToken),
  };

  const kmsKeyId = getEnvVariableOrFail('KMS_KEY_ID');
  const encryptedData = await encrypt({
    data: Buffer.from(JSON.stringify(data)),
    keyId: kmsKeyId,
  });

  const encodedData = encryptedData.toString('base64url');
  logger.debug(
    {
      encodedData,
    },
    'commonDb.paginationHelper.encryptPaginationToken.result',
  );
  return encodedData;
}

export async function decryptPaginationToken(params: { userId: string; paginationToken?: string }) {
  try {
    logger.debug(params, 'commonDb.paginationHelper.decryptPaginationToken.input');
    const { userId, paginationToken } = params;

    if (!paginationToken) {
      return;
    }

    const decryptedData = await decrypt({ data: Buffer.from(paginationToken, 'base64url') });
    const decodedData = decryptedData.toString('utf-8');
    const parsedData: PaginationTokenData = JSON.parse(decodedData);

    if (userId !== parsedData.userId) {
      const errorMsg = 'commonDb.paginationHelper.decryptPaginationToken.userMismatch';
      logger.warn({ currentUserId: userId, tokenUserId: parsedData.userId }, errorMsg);
      throw new Error(errorMsg);
    }

    const result = marshall(parsedData.token);
    logger.debug({ result }, 'commonDb.paginationHelper.decryptPaginationToken.result');
    return result;
  } catch (error) {
    logger.warn(error, 'commonDb.paginationHelper.decryptPaginationToken.error');
    throw new BadRequestError({
      message: ErrorMessage.invalidPaginationToken,
    });
  }
}
