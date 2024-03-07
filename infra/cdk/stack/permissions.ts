import { type Table } from 'aws-cdk-lib/aws-dynamodb';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { type Key } from 'aws-cdk-lib/aws-kms';
import { type Bucket } from 'aws-cdk-lib/aws-s3';

import { type createCognito } from './cognito';
import { type createStateMachineStartupLambdas, type createLambdas } from './lambdas';
import { type createStateMachines } from './sfn';
import { type createSqsQueues } from './sqs';

export function grantPermissions({
  region,
  account,
  lambdas,
  s3Bucket,
  openApiParamsSsmParamName,
  dynamoDbTable,
  cognito,
  kmsKey,
  sqsQueues,
  stateMachines,
  stateMachineStartupLambdas,
}: {
  region: string;
  account: string;
  lambdas: ReturnType<typeof createLambdas>;
  s3Bucket: Bucket;
  openApiParamsSsmParamName: string;
  dynamoDbTable: Table;
  cognito: ReturnType<typeof createCognito>;
  kmsKey: Key;
  sqsQueues: ReturnType<typeof createSqsQueues>;
  stateMachines: ReturnType<typeof createStateMachines>;
  stateMachineStartupLambdas: ReturnType<typeof createStateMachineStartupLambdas>;
}) {
  s3Bucket.grantPut(lambdas.getUrlForTemplateUpload);
  s3Bucket.grantReadWrite(lambdas.createTemplate);
  s3Bucket.grantDelete(lambdas.createTemplate);
  s3Bucket.grantDelete(lambdas.deleteTemplate);
  s3Bucket.grantRead(lambdas.getTemplate);
  s3Bucket.grantDelete(lambdas.deleteExpiredS3Objects);
  s3Bucket.grantReadWrite(lambdas.generateDocumentFromApiEvent);
  s3Bucket.grantReadWrite(lambdas.generateDocumentFromSfnEvent);
  s3Bucket.grantReadWrite(lambdas.getDocumentBatchResult);

  // We are using inline policy instead of ssmParam.grantRead() to not create circular dependency
  lambdas.getOpenApi.addToRolePolicy(
    new PolicyStatement({
      resources: [`arn:aws:ssm:${region}:${account}:parameter/${openApiParamsSsmParamName}`],
      actions: ['ssm:GetParameter'],
    }),
  );

  dynamoDbTable.grantWriteData(lambdas.createTemplate);
  dynamoDbTable.grantWriteData(lambdas.deleteTemplate);
  dynamoDbTable.grantReadData(lambdas.getTemplate);
  dynamoDbTable.grantReadData(lambdas.getTemplates);
  dynamoDbTable.grantReadData(lambdas.generateDocumentFromApiEvent);
  dynamoDbTable.grantReadData(lambdas.generateDocumentFromSfnEvent);
  dynamoDbTable.grantReadData(lambdas.getDocumentBatchResult);

  cognito.defaultUsersCredentialsSecret.grantRead(lambdas.setDefaultUserPassword);
  cognito.userPool.grant(lambdas.setDefaultUserPassword, 'cognito-idp:AdminSetUserPassword');

  kmsKey.grantEncryptDecrypt(lambdas.getTemplates);

  sqsQueues.deleteExpiredS3ObjectsQueue.grantSendMessages(lambdas.generateDocumentFromApiEvent);

  stateMachines.batchDocumentGenerationStateMachine.grantStartExecution(
    stateMachineStartupLambdas.startDocumentBatchGeneration,
  );
}
