import {
  CreateTableCommand,
  ResourceInUseException,
  type CreateTableCommandInput,
  type DynamoDBClient,
} from '@aws-sdk/client-dynamodb';

export async function initDb(client: DynamoDBClient) {
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

    throw error;
  }
}
