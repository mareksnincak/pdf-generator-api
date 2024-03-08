import { type Table } from 'aws-cdk-lib/aws-dynamodb';
import {
  DefinitionBody,
  Fail,
  JsonPath,
  Parallel,
  Map as SfnMap,
  StateMachine,
  TaskInput,
} from 'aws-cdk-lib/aws-stepfunctions';
import { LambdaInvoke } from 'aws-cdk-lib/aws-stepfunctions-tasks';
import { type Construct } from 'constructs';

import { DocumentBatchStatus } from '../../../src/db/document-batch/enum';

import { type createLambdas } from './lambdas';

function createDocumentBatchGenerationStateMachine({
  scope,
  lambdas,
  dynamoDbTable,
}: {
  scope: Construct;
  lambdas: ReturnType<typeof createLambdas>;
  dynamoDbTable: Table;
}) {
  const generateDocumentsTask = new SfnMap(scope, 'Generate documents', {
    itemsPath: JsonPath.stringAt('$.requestData.documents'),
    itemSelector: {
      userId: JsonPath.stringAt('$.userId'),
      document: JsonPath.stringAt('$$.Map.Item.Value'),
    },
    resultPath: JsonPath.stringAt('$.generateDocumentsResult'),
  });

  const generateDocumentTask = new LambdaInvoke(scope, 'Generate document', {
    lambdaFunction: lambdas.generateDocumentFromSfnEvent,
    payload: TaskInput.fromObject({
      userId: JsonPath.stringAt('$.userId'),
      ref: JsonPath.stringAt('$.document.ref'),
      templateId: JsonPath.stringAt('$.document.templateId'),
      data: JsonPath.stringAt('$.document.data'),
    }),
    resultSelector: {
      payload: JsonPath.stringAt('$.Payload'),
    },
  });

  generateDocumentsTask.itemProcessor(generateDocumentTask);

  const storeSuccessResultTask = new LambdaInvoke(scope, 'Store success result', {
    lambdaFunction: lambdas.storeDocumentBatchResult,
    payload: TaskInput.fromObject({
      id: JsonPath.stringAt('$$.Execution.Name'),
      userId: JsonPath.stringAt('$.userId'),
      status: DocumentBatchStatus.completed,
      results: JsonPath.stringAt('$.generateDocumentsResult[*].payload'),
    }),
  });

  const storeFailureResultTask = new LambdaInvoke(scope, 'Store failure result', {
    lambdaFunction: lambdas.storeDocumentBatchResult,
    payload: TaskInput.fromObject({
      id: JsonPath.stringAt('$$.Execution.Name'),
      userId: JsonPath.stringAt('$.userId'),
      status: DocumentBatchStatus.failure,
    }),
  });

  const successFlowDefinition = generateDocumentsTask.next(storeSuccessResultTask);
  const failureFlowDefinition = storeFailureResultTask.next(new Fail(scope, 'Fail'));

  const definition = new Parallel(scope, 'Generate document batch flow')
    .branch(successFlowDefinition)
    .addCatch(failureFlowDefinition, {
      resultPath: JsonPath.stringAt('$.error'),
    });

  return new StateMachine(scope, 'generate-document-batch-state-machine', {
    definitionBody: DefinitionBody.fromChainable(definition),
  });
}

export function createStateMachines({
  scope,
  lambdas,
  dynamoDbTable,
}: {
  scope: Construct;
  lambdas: ReturnType<typeof createLambdas>;
  dynamoDbTable: Table;
}) {
  const documentBatchGeneration = createDocumentBatchGenerationStateMachine({
    scope,
    lambdas,
    dynamoDbTable,
  });

  return { documentBatchGeneration };
}
