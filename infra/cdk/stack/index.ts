import { RemovalPolicy, Stack } from 'aws-cdk-lib';
import type { StackProps } from 'aws-cdk-lib';
import type { Construct } from 'constructs';

import { type CdkEnvVarsDto } from '../dtos/cdk-env-vars.dto';

import { createApi } from './api';
import { createCognito } from './cognito';
import { createDynamoDbEventSources, createDynamoDbTable } from './dynamo';
import { createGuardDutyMalwareProtection } from './guardduty';
import { createKmsKey } from './kms';
import { createLambdas, createStateMachineStartupLambdas } from './lambdas';
import { createAlarms } from './monitoring';
import { createOutputs } from './outputs';
import { grantPermissions } from './permissions';
import { createS3Bucket } from './s3';
import { createStateMachines } from './sfn';
import { createSqsEventSources, createSqsQueues } from './sqs';
import { createStringParameters, getStringParameters } from './ssm-parameters';

export class CdkStack extends Stack {
  constructor({
    cdkEnvVars,
    id,
    props,
    scope: stackScope,
  }: {
    cdkEnvVars: CdkEnvVarsDto;
    id: string;
    props?: StackProps;
    scope: Construct;
  }) {
    super(stackScope, id, props);

    const retainStatefulResources = cdkEnvVars.RETAIN_STATEFUL_RESOURCES;
    const removalPolicy = retainStatefulResources
      ? RemovalPolicy.RETAIN_ON_UPDATE_OR_DELETE
      : RemovalPolicy.DESTROY;

    const { alarmEmail, sentryDsn } = getStringParameters(this);

    const dynamoDbTable = createDynamoDbTable({ removalPolicy, scope: this, stackId: id });
    const s3Bucket = createS3Bucket({
      autoDeleteObjects: !retainStatefulResources,
      removalPolicy,
      scope: this,
      stackId: id,
    });
    const kmsKey = createKmsKey({ removalPolicy, scope: this, stackId: id });

    const s3BucketName = s3Bucket.bucketName;
    const openApiParamsSsmParamName = `${id}-open-api-params`;

    const sqsQueues = createSqsQueues({ scope: this, stackId: id });
    const lambdas = createLambdas({
      cdkEnvVars,
      dynamoDbTable,
      kmsKey,
      openApiParamsSsmParamName,
      retainStatefulResources,
      s3BucketName,
      scope: this,
      sentryDsn,
      sqsQueues,
    });

    const stateMachines = createStateMachines({ lambdas, scope: this });
    const stateMachineStartupLambdas = createStateMachineStartupLambdas({
      cdkEnvVars,
      dynamoDbTable,
      retainStatefulResources,
      scope: this,
      sentryDsn,
      stateMachines,
    });

    const cognito = createCognito({ lambdas, removalPolicy, scope: this, stackId: id });

    const api = createApi({
      cognito,
      lambdas,
      scope: this,
      stateMachineStartupLambdas,
    });

    createSqsEventSources({
      lambdas,
      sqsQueues,
    });

    createDynamoDbEventSources({
      dynamoDbTable,
      lambdas,
    });

    createGuardDutyMalwareProtection({
      account: this.account,
      processMalwareScanResultLambda: lambdas.processMalwareScanResult,
      region: this.region,
      s3Bucket,
      scope: this,
      sqsQueues,
    });

    grantPermissions({
      account: this.account,
      cognito,
      dynamoDbTable,
      kmsKey,
      lambdas,
      openApiParamsSsmParamName,
      region: this.region,
      s3Bucket,
      sqsQueues,
      stateMachines,
      stateMachineStartupLambdas,
    });

    createStringParameters({
      api,
      cognito,
      openApiParamsSsmParamName,
      scope: this,
    });

    createAlarms({ alarmEmail, scope: this, sqsQueues, stateMachines });

    createOutputs({ api, cognito, scope: this, sqsQueues });
  }
}
