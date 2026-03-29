import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

import { initDb } from '../src/db/common/helpers/db.helper';

const client = new DynamoDBClient({
  endpoint: 'http://localhost:8000',
  region: 'local',
});

void initDb(client);
