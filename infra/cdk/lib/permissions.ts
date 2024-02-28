import { type Bucket } from 'aws-cdk-lib/aws-s3';
import { type createLambdas } from './lambdas';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';

export function grantPermissions({
  region,
  account,
  lambdas,
  s3Bucket,
  apiUrlSsmParamName,
}: {
  region: string;
  account: string;
  lambdas: ReturnType<typeof createLambdas>;
  s3Bucket: Bucket;
  apiUrlSsmParamName: string;
}) {
  s3Bucket.grantWrite(lambdas.getUrlForTemplateUpload);
  s3Bucket.grantReadWrite(lambdas.createTemplate);
  s3Bucket.grantDelete(lambdas.createTemplate);

  // We are using inline policy instead of ssmParam.grantRead() to not create circular dependency
  lambdas.getOpenApi.addToRolePolicy(
    new PolicyStatement({
      resources: [`arn:aws:ssm:${region}:${account}:parameter/${apiUrlSsmParamName}`],
      actions: ['ssm:GetParameter'],
    }),
  );
}
