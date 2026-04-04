import { type Table } from 'aws-cdk-lib/aws-dynamodb';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { type Key } from 'aws-cdk-lib/aws-kms';
import { type Bucket } from 'aws-cdk-lib/aws-s3';

import { type createCognito } from './cognito';
import { type createLambdas, type createStateMachineStartupLambdas } from './lambdas';
import { type createStateMachines } from './sfn';
import { type createSqsQueues } from './sqs';

export function grantPermissions({
  account,
  cognito,
  dynamoDbTable,
  kmsKey,
  lambdas,
  openApiParamsSsmParamName,
  region,
  s3Bucket,
  sqsQueues,
  stateMachines,
  stateMachineStartupLambdas,
}: {
  account: string;
  cognito: ReturnType<typeof createCognito>;
  dynamoDbTable: Table;
  kmsKey: Key;
  lambdas: ReturnType<typeof createLambdas>;
  openApiParamsSsmParamName: string;
  region: string;
  s3Bucket: Bucket;
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
  s3Bucket.grantDelete(lambdas.deleteOrphanedS3Objects);
  s3Bucket.grantReadWrite(lambdas.generateDocumentFromApiEvent);
  s3Bucket.grantReadWrite(lambdas.generateDocumentFromSfnEvent);
  s3Bucket.grantReadWrite(lambdas.getDocumentBatchResult);
  s3Bucket.grantReadWrite(lambdas.processMalwareScanResult);

  // We are using inline policy instead of ssmParam.grantRead() to not create circular dependency
  lambdas.getOpenApi.addToRolePolicy(
    new PolicyStatement({
      actions: ['ssm:GetParameter'],
      resources: [`arn:aws:ssm:${region}:${account}:parameter/${openApiParamsSsmParamName}`],
    }),
  );

  dynamoDbTable.grantWriteData(lambdas.createTemplate);
  dynamoDbTable.grantWriteData(lambdas.deleteTemplate);
  dynamoDbTable.grantReadData(lambdas.getTemplate);
  dynamoDbTable.grantReadData(lambdas.getTemplates);
  dynamoDbTable.grantReadData(lambdas.generateDocumentFromApiEvent);
  dynamoDbTable.grantReadData(lambdas.generateDocumentFromSfnEvent);
  dynamoDbTable.grantReadData(lambdas.getDocumentBatchResult);
  dynamoDbTable.grantWriteData(lambdas.storeDocumentBatchResult);
  dynamoDbTable.grantWriteData(stateMachineStartupLambdas.startDocumentBatchGeneration);
  dynamoDbTable.grantWriteData(lambdas.processMalwareScanResult);

  cognito.defaultUsersCredentialsSecret.grantRead(lambdas.setDefaultUserPassword);
  cognito.userPool.grant(lambdas.setDefaultUserPassword, 'cognito-idp:AdminSetUserPassword');

  kmsKey.grantEncryptDecrypt(lambdas.getTemplates);

  sqsQueues.deleteExpiredS3ObjectsQueue.grantSendMessages(lambdas.generateDocumentFromApiEvent);
  sqsQueues.deleteExpiredS3ObjectsQueue.grantSendMessages(lambdas.getUrlForTemplateUpload);

  stateMachines.documentBatchGeneration.grantStartExecution(
    stateMachineStartupLambdas.startDocumentBatchGeneration,
  );
}
