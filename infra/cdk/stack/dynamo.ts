import { type RemovalPolicy } from 'aws-cdk-lib';
import { AttributeType, ProjectionType, Table } from 'aws-cdk-lib/aws-dynamodb';
import { type Construct } from 'constructs';

import { DynamoIndex } from '../../../src/db/common/enums/dynamo.enum';

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
    timeToLiveAttribute: 'expiresAt',
  });

  table.addGlobalSecondaryIndex({
    indexName: DynamoIndex.GSI1,
    partitionKey: {
      name: 'GSI1PK',
      type: AttributeType.STRING,
    },
    sortKey: {
      name: 'GSI1SK',
      type: AttributeType.STRING,
    },
    projectionType: ProjectionType.ALL,
  });

  return table;
}
