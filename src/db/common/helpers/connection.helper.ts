import { DynamoDBClient, type DynamoDBClientConfig } from '@aws-sdk/client-dynamodb';

import { getEnvVariableOrFail } from '../../../helpers/env.helper';

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

  if (process.env.DYNAMODB_REGION) {
    config.region = process.env.DYNAMODB_REGION;
  }

  client = new DynamoDBClient(config);
  return client;
}

export function getTableName() {
  if (tableName) {
    return tableName;
  }

  tableName = getEnvVariableOrFail('DYNAMODB_TABLE_NAME');
  return tableName;
}
