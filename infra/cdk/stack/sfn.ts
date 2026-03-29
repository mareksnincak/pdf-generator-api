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
  lambdas,
  scope,
}: {
  lambdas: ReturnType<typeof createLambdas>;
  scope: Construct;
}) {
  const generateDocumentsTask = new SfnMap(scope, 'Generate documents', {
    itemSelector: {
      document: JsonPath.stringAt('$$.Map.Item.Value'),
      userId: JsonPath.stringAt('$.userId'),
    },
    itemsPath: JsonPath.stringAt('$.requestData.documents'),
    resultPath: JsonPath.stringAt('$.generateDocumentsResult'),
  });

  const generateDocumentTask = new LambdaInvoke(scope, 'Generate document', {
    lambdaFunction: lambdas.generateDocumentFromSfnEvent,
    payload: TaskInput.fromObject({
      data: JsonPath.stringAt('$.document.data'),
      ref: JsonPath.stringAt('$.document.ref'),
      templateId: JsonPath.stringAt('$.document.templateId'),
      userId: JsonPath.stringAt('$.userId'),
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
      results: JsonPath.stringAt('$.generateDocumentsResult[*].payload'),
      status: DocumentBatchStatus.completed,
      userId: JsonPath.stringAt('$.userId'),
    }),
  });

  const storeFailureResultTask = new LambdaInvoke(scope, 'Store failure result', {
    lambdaFunction: lambdas.storeDocumentBatchResult,
    payload: TaskInput.fromObject({
      id: JsonPath.stringAt('$$.Execution.Name'),
      status: DocumentBatchStatus.failure,
      userId: JsonPath.stringAt('$.userId'),
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
  lambdas,
  scope,
}: {
  lambdas: ReturnType<typeof createLambdas>;
  scope: Construct;
}) {
  const documentBatchGeneration = createDocumentBatchGenerationStateMachine({
    lambdas,
    scope,
  });

  return { documentBatchGeneration };
}
