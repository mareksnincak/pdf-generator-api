import { RemovalPolicy, Stack } from 'aws-cdk-lib';
import type { StackProps } from 'aws-cdk-lib';
import type { Construct } from 'constructs';

import { type CdkEnvVarsDto } from '../dtos/cdk-env-vars.dto';

import { createApi } from './api';
import { createCognito } from './cognito';
import { createDynamoDbTable } from './dynamo';
import { createKmsKey } from './kms';
import { createLambdas } from './lambdas';
import { createOutputs } from './outputs';
import { grantPermissions } from './permissions';
import { createS3Bucket } from './s3';
import { createSqsEventSources, createSqsQueues } from './sqs';
import { createStringParameters } from './ssm-parameters';

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

    const retainStatefulResources = cdkEnvVars.RETAIN_STATEFUL_RESOURCES;
    const removalPolicy = retainStatefulResources
      ? RemovalPolicy.RETAIN_ON_UPDATE_OR_DELETE
      : RemovalPolicy.DESTROY;

    const dynamoDbTable = createDynamoDbTable({ scope: this, stackId: id, removalPolicy });
    const s3Bucket = createS3Bucket({
      scope: this,
      stackId: id,
      removalPolicy,
      autoDeleteObjects: !retainStatefulResources,
    });
    const kmsKey = createKmsKey({ scope: this, stackId: id, removalPolicy });

    const s3BucketName = s3Bucket.bucketName;
    const openApiParamsSsmParamName = `${id}-open-api-params`;

    const sqsQueues = createSqsQueues({ scope: this, stackId: id });
    const lambdas = createLambdas({
      scope: this,
      s3BucketName,
      openApiParamsSsmParamName,
      cdkEnvVars,
      dynamoDbTable,
      kmsKey,
      retainStatefulResources,
      sqsQueues,
    });

    const cognito = createCognito({ scope: this, stackId: id, lambdas, removalPolicy });

    const api = createApi({
      scope: this,
      lambdas,
      cognito,
    });

    createSqsEventSources({
      sqsQueues,
      lambdas,
    });

    grantPermissions({
      region: this.region,
      account: this.account,
      lambdas,
      s3Bucket,
      openApiParamsSsmParamName,
      dynamoDbTable,
      cognito,
      kmsKey,
      sqsQueues,
    });

    createStringParameters({
      scope: this,
      api,
      openApiParamsSsmParamName,
      cognito,
    });

    createOutputs({ scope: this, api, cognito, sqsQueues });
  }
}
