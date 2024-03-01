import { Stack } from 'aws-cdk-lib';
import type { StackProps } from 'aws-cdk-lib';
import type { Construct } from 'constructs';

import { type CdkEnvVarsDto } from '../dtos/cdk-env-vars.dto';

import { createApi } from './api';
import { createCognito } from './cognito';
import { createDynamoDbTable } from './dynamo';
import { createLambdas } from './lambdas';
import { createOutputs } from './outputs';
import { grantPermissions } from './permissions';
import { createS3Bucket } from './s3';
import { createSsmParameters } from './ssm-parameters';

// TODO move lib/cdk.stack.ts to stack/index.ts
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

    const cognito = createCognito(this, id);

    const api = createApi({ scope: this, lambdas });

    grantPermissions({
      region: this.region,
      account: this.account,
      lambdas,
      s3Bucket,
      apiUrlSsmParamName,
      dynamoDbTable,
    });

    const ssmParameterNames = createSsmParameters({
      scope: this,
      stackId: id,
      api,
      apiUrlSsmParamName,
      defaultUserCredentials: cognito.defaultUserCredentials,
    });

    createOutputs({ scope: this, api, ssmParameterNames });
  }
}
