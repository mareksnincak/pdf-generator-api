import { type RemovalPolicy } from 'aws-cdk-lib';
import { AttributeType, ProjectionType, StreamViewType, Table } from 'aws-cdk-lib/aws-dynamodb';
import { FilterCriteria, FilterRule, StartingPosition } from 'aws-cdk-lib/aws-lambda';
import { DynamoEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { type Construct } from 'constructs';

import { DynamoIndex } from '../../../src/db/common/enums/dynamo.enum';

import { type createLambdas } from './lambdas';

export function createDynamoDbTable({
  removalPolicy,
  scope,
  stackId,
}: {
  removalPolicy: RemovalPolicy;
  scope: Construct;
  stackId: string;
}) {
  const table = new Table(scope, 'dynamo-db', {
    partitionKey: {
      name: 'PK',
      type: AttributeType.STRING,
    },
    removalPolicy,
    sortKey: {
      name: 'SK',
      type: AttributeType.STRING,
    },
    stream: StreamViewType.OLD_IMAGE,
    tableName: stackId,
    timeToLiveAttribute: 'expiresAt',
  });

  table.addGlobalSecondaryIndex({
    indexName: DynamoIndex.GSI1,
    partitionKey: {
      name: 'GSI1PK',
      type: AttributeType.STRING,
    },
    projectionType: ProjectionType.ALL,
    sortKey: {
      name: 'GSI1SK',
      type: AttributeType.STRING,
    },
  });

  return table;
}

export function createDynamoDbEventSources({
  dynamoDbTable,
  lambdas,
}: {
  dynamoDbTable: Table;
  lambdas: ReturnType<typeof createLambdas>;
}) {
  const itemRemovalEventSource = new DynamoEventSource(dynamoDbTable, {
    bisectBatchOnError: true,
    filters: [FilterCriteria.filter({ eventName: FilterRule.isEqual('REMOVE') as unknown })],
    retryAttempts: 10,
    startingPosition: StartingPosition.LATEST,
  });

  lambdas.deleteOrphanedS3Objects.addEventSource(itemRemovalEventSource);
}
