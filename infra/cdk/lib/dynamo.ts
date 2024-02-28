import { AttributeType, Table } from 'aws-cdk-lib/aws-dynamodb';
import { type Construct } from 'constructs';

export function createDynamoDbTable(scope: Construct, id: string) {
  const table = new Table(scope, id, {
    tableName: id,
    partitionKey: {
      name: 'PK',
      type: AttributeType.STRING,
    },
    sortKey: {
      name: 'SK',
      type: AttributeType.STRING,
    },
  });

  return table;
}
