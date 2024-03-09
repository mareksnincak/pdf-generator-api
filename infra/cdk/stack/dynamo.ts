import { type RemovalPolicy } from 'aws-cdk-lib';
import { AttributeType, ProjectionType, StreamViewType, Table } from 'aws-cdk-lib/aws-dynamodb';
import { FilterCriteria, FilterRule, StartingPosition } from 'aws-cdk-lib/aws-lambda';
import { DynamoEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { type Construct } from 'constructs';

import { DynamoIndex } from '../../../src/db/common/enums/dynamo.enum';

import { type createLambdas } from './lambdas';

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
    stream: StreamViewType.NEW_AND_OLD_IMAGES,
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

export function createDynamoDbEventSources({
  dynamoDbTable,
  lambdas,
}: {
  dynamoDbTable: Table;
  lambdas: ReturnType<typeof createLambdas>;
}) {
  const itemRemovalEventSource = new DynamoEventSource(dynamoDbTable, {
    startingPosition: StartingPosition.LATEST,
    filters: [FilterCriteria.filter({ eventName: FilterRule.isEqual('REMOVE') })],
  });

  lambdas.deleteOrphanedS3Objects.addEventSource(itemRemovalEventSource);
}
