import { type RemovalPolicy } from 'aws-cdk-lib';
import { AttributeType, Table } from 'aws-cdk-lib/aws-dynamodb';
import { type Construct } from 'constructs';

export function createDynamoDbTable({
  scope,
  stackId,
  removalPolicy,
}: {
  scope: Construct;
  stackId: string;
  removalPolicy: RemovalPolicy;
}) {
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
    removalPolicy,
  });

  return table;
}
