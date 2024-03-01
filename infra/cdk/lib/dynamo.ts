import { RemovalPolicy } from 'aws-cdk-lib';
import { AttributeType, Table } from 'aws-cdk-lib/aws-dynamodb';
import { type Construct } from 'constructs';

export function createDynamoDbTable(scope: Construct, stackId: string) {
  const table = new Table(scope, 'dynamo-db', {
    tableName: stackId,
    partitionKey: {
      name: 'PK',
      type: AttributeType.STRING,
    },
    sortKey: {
      name: 'SK',
      type: AttributeType.STRING,
    },
    removalPolicy: RemovalPolicy.RETAIN_ON_UPDATE_OR_DELETE,
  });

  return table;
}
