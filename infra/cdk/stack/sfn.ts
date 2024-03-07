import {
  DefinitionBody,
  JsonPath,
  Map as SfnMap,
  StateMachine,
  TaskInput,
} from 'aws-cdk-lib/aws-stepfunctions';
import { LambdaInvoke } from 'aws-cdk-lib/aws-stepfunctions-tasks';
import { type Construct } from 'constructs';

import { type createLambdas } from './lambdas';

export function createStateMachines({
  scope,
  lambdas,
}: {
  scope: Construct;
  lambdas: ReturnType<typeof createLambdas>;
}) {
  const generateDocumentsTask = new SfnMap(scope, 'Generate documents', {
    itemsPath: JsonPath.stringAt('$.requestData.documents'),
    itemSelector: {
      userId: JsonPath.stringAt('$.userId'),
      document: JsonPath.stringAt('$$.Map.Item.Value'),
    },
  });

  const generateDocumentTask = new LambdaInvoke(scope, 'Generate document', {
    lambdaFunction: lambdas.generateDocumentFromSfnEvent,
    payload: TaskInput.fromObject({
      userId: JsonPath.stringAt('$.userId'),
      ref: JsonPath.stringAt('$.document.ref'),
      templateId: JsonPath.stringAt('$.document.templateId'),
      data: JsonPath.stringAt('$.document.data'),
    }),
  });

  generateDocumentsTask.itemProcessor(generateDocumentTask);

  const batchDocumentGenerationStateMachine = new StateMachine(
    scope,
    'generate-document-batch-state-machine',
    {
      definitionBody: DefinitionBody.fromChainable(generateDocumentsTask),
    },
  );

  return { batchDocumentGenerationStateMachine };
}
