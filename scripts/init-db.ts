import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

import { initDb } from '../src/db/common/helpers/db.helper';

const client = new DynamoDBClient({
  region: 'local',
  endpoint: 'http://localhost:8000',
});

void initDb(client);
