import {
  CreateTableCommand,
  type CreateTableCommandInput,
  type DynamoDBClient,
  ResourceInUseException,
} from '@aws-sdk/client-dynamodb';

export async function initDb(client: DynamoDBClient) {
  try {
    const table: CreateTableCommandInput = {
      AttributeDefinitions: [
        { AttributeName: 'PK', AttributeType: 'S' },
        { AttributeName: 'SK', AttributeType: 'S' },
        { AttributeName: 'GSI1PK', AttributeType: 'S' },
        { AttributeName: 'GSI1SK', AttributeType: 'S' },
      ],
      BillingMode: 'PAY_PER_REQUEST',
      GlobalSecondaryIndexes: [
        {
          IndexName: 'GSI1',
          KeySchema: [
            { AttributeName: 'GSI1PK', KeyType: 'HASH' },
            { AttributeName: 'GSI1SK', KeyType: 'RANGE' },
          ],
          Projection: { ProjectionType: 'ALL' },
        },
      ],
      KeySchema: [
        { AttributeName: 'PK', KeyType: 'HASH' },
        { AttributeName: 'SK', KeyType: 'RANGE' },
      ],
      TableName: 'PdfGenerator',
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
