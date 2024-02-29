import { type Table } from 'aws-cdk-lib/aws-dynamodb';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { type Bucket } from 'aws-cdk-lib/aws-s3';

import { type createLambdas } from './lambdas';

export function grantPermissions({
  region,
  account,
  lambdas,
  s3Bucket,
  apiUrlSsmParamName,
  dynamoDbTable,
}: {
  region: string;
  account: string;
  lambdas: ReturnType<typeof createLambdas>;
  s3Bucket: Bucket;
  apiUrlSsmParamName: string;
  dynamoDbTable: Table;
}) {
  s3Bucket.grantPut(lambdas.getUrlForTemplateUpload);
  s3Bucket.grantReadWrite(lambdas.createTemplate);
  s3Bucket.grantDelete(lambdas.createTemplate);
  s3Bucket.grantDelete(lambdas.deleteTemplate);

  // We are using inline policy instead of ssmParam.grantRead() to not create circular dependency
  lambdas.getOpenApi.addToRolePolicy(
    new PolicyStatement({
      resources: [`arn:aws:ssm:${region}:${account}:parameter/${apiUrlSsmParamName}`],
      actions: ['ssm:GetParameter'],
    }),
  );

  dynamoDbTable.grantWriteData(lambdas.createTemplate);
  dynamoDbTable.grantWriteData(lambdas.deleteTemplate);
}
