import { type AttributeValue } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

import { decrypt, encrypt } from '../../../helpers/kms.helper';
import { logger } from '../../../helpers/logger.helper';

export async function encryptPaginationToken(
  lastEvaluatedKey: Record<string, AttributeValue> | undefined,
) {
  logger.debug({ lastEvaluatedKey }, 'commonDb.paginationHelper.encryptPaginationToken.input');
  if (!lastEvaluatedKey) {
    return null;
  }

  const kmsKeyId = process.env.KMS_KEY_ID;
  if (!kmsKeyId) {
    throw new Error('commonDb.paginationHelper.encryptPaginationToken.missingKmsKeyId');
  }

  const rawData = JSON.stringify(unmarshall(lastEvaluatedKey));
  const encryptedData = await encrypt({ data: Buffer.from(rawData), keyId: kmsKeyId });
  const encodedData = encryptedData.toString('base64url');

  logger.debug(
    {
      encodedData,
    },
    'commonDb.paginationHelper.encryptPaginationToken.result',
  );
  return encryptedData.toString('base64url');
}

export async function decryptPaginationToken(paginationToken?: string) {
  logger.debug({ paginationToken }, 'commonDb.paginationHelper.decryptPaginationToken.input');
  if (!paginationToken) {
    return;
  }

  const decryptedData = await decrypt({ data: Buffer.from(paginationToken, 'base64url') });
  const decodedData = decryptedData.toString('utf-8');
  const parsedData = marshall(JSON.parse(decodedData));

  logger.debug({ parsedData }, 'commonDb.paginationHelper.decryptPaginationToken.result');
  return parsedData;
}
