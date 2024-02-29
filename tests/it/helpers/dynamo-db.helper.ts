import { DeleteTableCommand, ResourceNotFoundException } from '@aws-sdk/client-dynamodb';

import { getDynamoDbClient, getTableName } from '../../../src/db/common/helpers/connection.helper';
import { initDb } from '../../../src/db/common/helpers/db.helper';

/**
 * Recreates fresh DynamoDB table
 */
export async function refreshDynamoDb(client = getDynamoDbClient()) {
  try {
    await client.send(
      new DeleteTableCommand({
        TableName: getTableName(),
      }),
    );
  } catch (error) {
    // Don't throw error if table didn't exist before
    if (!(error instanceof ResourceNotFoundException)) {
      throw error;
    }
  }

  await initDb(client);
}
