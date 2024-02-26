import {
  CreateTableCommand,
  type CreateTableCommandInput,
  DynamoDB,
  ResourceInUseException,
} from '@aws-sdk/client-dynamodb';

const client = new DynamoDB({
  region: 'local',
  endpoint: 'http://localhost:8000',
});

async function initDb() {
  try {
    const table: CreateTableCommandInput = {
      TableName: 'PdfGenerator',
      BillingMode: 'PAY_PER_REQUEST',
      KeySchema: [
        { AttributeName: 'PK', KeyType: 'HASH' },
        { AttributeName: 'SK', KeyType: 'RANGE' },
      ],
      AttributeDefinitions: [
        { AttributeName: 'PK', AttributeType: 'S' },
        { AttributeName: 'SK', AttributeType: 'S' },
      ],
    };

    const command = new CreateTableCommand(table);
    await client.send(command);
  } catch (error) {
    if (error instanceof ResourceInUseException) {
      return;
    }

    console.error(error);
    throw error;
  }
}

void initDb();
