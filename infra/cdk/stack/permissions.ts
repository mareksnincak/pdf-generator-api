import { type Table } from 'aws-cdk-lib/aws-dynamodb';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { type Key } from 'aws-cdk-lib/aws-kms';
import { type Bucket } from 'aws-cdk-lib/aws-s3';

import { type createCognito } from './cognito';
import { type createLambdas } from './lambdas';

export function grantPermissions({
  region,
  account,
  lambdas,
  s3Bucket,
  openApiParamsSsmParamName,
  dynamoDbTable,
  cognito,
  kmsKey,
}: {
  region: string;
  account: string;
  lambdas: ReturnType<typeof createLambdas>;
  s3Bucket: Bucket;
  openApiParamsSsmParamName: string;
  dynamoDbTable: Table;
  cognito: ReturnType<typeof createCognito>;
  kmsKey: Key;
}) {
  s3Bucket.grantPut(lambdas.getUrlForTemplateUpload);
  s3Bucket.grantReadWrite(lambdas.createTemplate);
  s3Bucket.grantDelete(lambdas.createTemplate);
  s3Bucket.grantDelete(lambdas.deleteTemplate);
  s3Bucket.grantRead(lambdas.getTemplate);

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

  cognito.defaultUsersCredentialsSecret.grantRead(lambdas.setDefaultUserPassword);
  cognito.userPool.grant(lambdas.setDefaultUserPassword, 'cognito-idp:AdminSetUserPassword');

  kmsKey.grantEncryptDecrypt(lambdas.getTemplates);
}
