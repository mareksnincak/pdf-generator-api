import { DefinitionBody, Pass, StateMachine } from 'aws-cdk-lib/aws-stepfunctions';
import { type Construct } from 'constructs';

export function createStateMachines({ scope }: { scope: Construct }) {
  const batchDocumentGenerationStateMachine = new StateMachine(
    scope,
    'generate-document-batch-state-machine',
    {
      definitionBody: DefinitionBody.fromChainable(new Pass(scope, 'dummy-sfn-task')),
    },
  );

  return { batchDocumentGenerationStateMachine };
}
