import { Stack } from 'aws-cdk-lib';

import type { StackProps } from 'aws-cdk-lib';
import type { Construct } from 'constructs';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { type CdkEnvVarsDto } from '../dtos/cdk-env-vars.dto';
import { createDynamoDbTable } from './dynamo';
import { createS3Bucket } from './s3';
import { createLambdas } from './lambdas';
import { grantPermissions } from './permissions';
import { createApi } from './api';
import { createOutputs } from './outputs';

export class CdkStack extends Stack {
  constructor({
    scope,
    id,
    props,
    cdkEnvVars,
  }: {
    scope: Construct;
    id: string;
    props?: StackProps;
    cdkEnvVars: CdkEnvVarsDto;
  }) {
    super(scope, id, props);

    const dynamoDbTable = createDynamoDbTable(this, id);
    const s3Bucket = createS3Bucket(this, id);

    const s3BucketName = s3Bucket.bucketName;
    const apiUrlSsmParamName = `${id}-api-url`;

    const lambdas = createLambdas({
      scope: this,
      s3BucketName,
      apiUrlSsmParamName,
      cdkEnvVars,
      dynamoDbTable,
    });

    const api = createApi({ scope: this, lambdas });

    new StringParameter(this, 'api-url', {
      parameterName: apiUrlSsmParamName,
      stringValue: api.url,
    });

    grantPermissions({
      region: this.region,
      account: this.account,
      lambdas,
      s3Bucket,
      apiUrlSsmParamName,
      dynamoDbTable,
    });

    createOutputs({ scope: this, api });
  }
}
