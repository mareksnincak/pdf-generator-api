import { DynamoDBClient, type DynamoDBClientConfig } from '@aws-sdk/client-dynamodb';

let client: DynamoDBClient;
let tableName: string;

export function getDynamoDbClient() {
  if (client) {
    return client;
  }

  const config: DynamoDBClientConfig = {};

  if (process.env.DYNAMODB_ENDPOINT) {
    config.endpoint = process.env.DYNAMODB_ENDPOINT;
  }

  client = new DynamoDBClient(config);
  return client;
}

export function getTableName() {
  if (tableName) {
    return tableName;
  }

  if (!process.env.DYNAMODB_TABLE_NAME) {
    throw new Error('commonDb.connectionHelper.getTableName.missingEnv');
  }

  tableName = process.env.DYNAMODB_TABLE_NAME;
  return tableName;
}
