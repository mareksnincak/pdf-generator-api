import { BatchGetItemCommand, BatchWriteItemCommand } from '@aws-sdk/client-dynamodb';

import type { AttributeValue, WriteRequest } from '@aws-sdk/client-dynamodb';
import { logger } from '../../../helpers/logger.helper';
import { getDynamoDbClient, getTableName } from './connection.helper';

export function verifyBatchCompletionOrFail({
  unprocessedRecords,
  errorMsg,
}: {
  unprocessedRecords?: Record<string, unknown>;
  errorMsg: string;
}) {
  if (!unprocessedRecords || !Object.keys(unprocessedRecords).length) {
    return;
  }

  logger.error(errorMsg, {
    unprocessedRecords,
  });
  throw new Error(errorMsg);
}

function splitToBatches<T>(data: T[], chunkSize: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < data.length; i += chunkSize) {
    const batch = data.slice(i, i + chunkSize);
    batches.push(batch);
  }

  return batches;
}

export async function writeBatch(items: WriteRequest[], batchSize = 25) {
  const tableName = getTableName();
  const itemBatches = splitToBatches(items, batchSize);

  const batchWriteItemPromises = itemBatches.map(async (itemBatch) => {
    const command = new BatchWriteItemCommand({
      RequestItems: {
        [tableName]: itemBatch,
      },
    });

    const batchResult = await getDynamoDbClient().send(command);

    verifyBatchCompletionOrFail({
      unprocessedRecords: batchResult.UnprocessedItems,
      errorMsg: 'commonDb.batchHelper.writeBatch.incomplete',
    });
  });

  await Promise.all(batchWriteItemPromises);
}

export async function readBatch(keys: Record<string, AttributeValue>[], batchSize = 100) {
  const tableName = getTableName();
  const keyBatches = splitToBatches(keys, batchSize);

  const batchGetItemPromises = keyBatches.map(async (keyBatch) => {
    const command = new BatchGetItemCommand({
      RequestItems: {
        [tableName]: {
          Keys: keyBatch,
        },
      },
    });

    const result = await getDynamoDbClient().send(command);

    verifyBatchCompletionOrFail({
      unprocessedRecords: result.UnprocessedKeys,
      errorMsg: 'commonDb.batchHelper.readBatch.incomplete',
    });

    return result.Responses?.[tableName] ?? [];
  });

  const itemsByBatches = await Promise.all(batchGetItemPromises);
  const allItems = itemsByBatches.flat(1);

  return allItems;
}
