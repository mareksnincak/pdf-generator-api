import { join } from 'node:path';

import { Duration } from 'aws-cdk-lib';
import { type Table } from 'aws-cdk-lib/aws-dynamodb';
import { type Key } from 'aws-cdk-lib/aws-kms';
import { Architecture, Runtime } from 'aws-cdk-lib/aws-lambda';
import {
  type BundlingOptions,
  NodejsFunction,
  type NodejsFunctionProps,
} from 'aws-cdk-lib/aws-lambda-nodejs';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { type Construct } from 'constructs';

import { getEnvVars } from '../../../config/helpers/config.helper';
import { type CdkEnvVarsDto } from '../dtos/cdk-env-vars.dto';
import { Lambda } from '../enums/lambda.enum';

import { type createSqsQueues } from './sqs';

function getLambdaEntryPath(lambda: Lambda) {
  return join(__dirname, '..', '..', '..', 'src', 'lambdas', lambda, 'handler.ts');
}

function getCommonNodeJsFunctionProps({
  lambda,
  cdkEnvVars,
  retainStatefulResources,
  architecture = Architecture.ARM_64,
  memorySize,
  bundlingOptions,
}: {
  lambda: Lambda;
  cdkEnvVars: CdkEnvVarsDto;
  retainStatefulResources: boolean;
  architecture?: Architecture;
  memorySize?: number;
  bundlingOptions?: BundlingOptions;
}) {
  return {
    runtime: Runtime.NODEJS_20_X,
    architecture,
    entry: getLambdaEntryPath(lambda),
    bundling: {
      /**
       * We are using static hash to be able to use local watch.
       * We need dynamic hash for deploy as otherwise cdk won't pick
       * up new lambda changes
       */
      assetHash: cdkEnvVars.FORCE_STATIC_HASH ? lambda : undefined,
      ...bundlingOptions,
    },
    logRetention: retainStatefulResources ? RetentionDays.ONE_MONTH : RetentionDays.ONE_DAY,
    timeout: Duration.seconds(30),
    memorySize,
  } satisfies NodejsFunctionProps;
}

export function createLambdas({
  scope,
  cdkEnvVars,
  openApiParamsSsmParamName,
  s3BucketName,
  dynamoDbTable,
  kmsKey,
  retainStatefulResources,
  sqsQueues,
}: {
  scope: Construct;
  cdkEnvVars: CdkEnvVarsDto;
  openApiParamsSsmParamName: string;
  s3BucketName: string;
  dynamoDbTable: Table;
  kmsKey: Key;
  retainStatefulResources: boolean;
  sqsQueues: ReturnType<typeof createSqsQueues>;
}) {
  const envVars = getEnvVars(cdkEnvVars.ENVIRONMENT_NAME);

  const getOpenApi = new NodejsFunction(scope, Lambda.getOpenApi, {
    ...getCommonNodeJsFunctionProps({
      lambda: Lambda.getOpenApi,
      cdkEnvVars,
      retainStatefulResources,
    }),
    handler: 'getOpenApi',
    environment: {
      OPEN_API_SSM_PARAM_NAME: openApiParamsSsmParamName,
      ...envVars.get(Lambda.getOpenApi),
    },
  });

  const getUrlForTemplateUpload = new NodejsFunction(scope, Lambda.getUrlForTemplateUpload, {
    ...getCommonNodeJsFunctionProps({
      lambda: Lambda.getUrlForTemplateUpload,
      cdkEnvVars,
      retainStatefulResources,
    }),
    handler: 'getUrlForTemplateUpload',
    environment: {
      S3_BUCKET: s3BucketName,
      ...envVars.get(Lambda.getUrlForTemplateUpload),
    },
  });

  const createTemplate = new NodejsFunction(scope, Lambda.createTemplate, {
    ...getCommonNodeJsFunctionProps({
      lambda: Lambda.createTemplate,
      cdkEnvVars,
      retainStatefulResources,
    }),
    handler: 'createTemplate',
    environment: {
      DYNAMODB_TABLE_NAME: dynamoDbTable.tableName,
      S3_BUCKET: s3BucketName,
      ...envVars.get(Lambda.createTemplate),
    },
  });

  const getTemplate = new NodejsFunction(scope, Lambda.getTemplate, {
    ...getCommonNodeJsFunctionProps({
      lambda: Lambda.getTemplate,
      cdkEnvVars,
      retainStatefulResources,
    }),
    handler: 'getTemplate',
    environment: {
      DYNAMODB_TABLE_NAME: dynamoDbTable.tableName,
      S3_BUCKET: s3BucketName,
      ...envVars.get(Lambda.getTemplate),
    },
  });

  const getTemplates = new NodejsFunction(scope, Lambda.getTemplates, {
    ...getCommonNodeJsFunctionProps({
      lambda: Lambda.getTemplates,
      cdkEnvVars,
      retainStatefulResources,
    }),
    handler: 'getTemplates',
    environment: {
      DYNAMODB_TABLE_NAME: dynamoDbTable.tableName,
      KMS_KEY_ID: kmsKey.keyId,
      ...envVars.get(Lambda.getTemplates),
    },
  });

  const deleteTemplate = new NodejsFunction(scope, Lambda.deleteTemplate, {
    ...getCommonNodeJsFunctionProps({
      lambda: Lambda.deleteTemplate,
      cdkEnvVars,
      retainStatefulResources,
    }),
    handler: 'deleteTemplate',
    environment: {
      DYNAMODB_TABLE_NAME: dynamoDbTable.tableName,
      S3_BUCKET: s3BucketName,
      ...envVars.get(Lambda.deleteTemplate),
    },
  });

  const setDefaultUserPassword = new NodejsFunction(scope, Lambda.setDefaultUserPassword, {
    ...getCommonNodeJsFunctionProps({
      lambda: Lambda.setDefaultUserPassword,
      cdkEnvVars,
      retainStatefulResources,
    }),
    handler: 'setDefaultUserPassword',
    environment: {
      ...envVars.get(Lambda.setDefaultUserPassword),
    },
  });

  const generateDocument = new NodejsFunction(scope, Lambda.generateDocument, {
    ...getCommonNodeJsFunctionProps({
      lambda: Lambda.generateDocument,
      cdkEnvVars,
      retainStatefulResources,
      architecture: Architecture.X86_64,
      memorySize: 2048,
      bundlingOptions: {
        nodeModules: ['@sparticuz/chromium'],
        loader: {
          '.ttf': 'file',
        },
      },
    }),
    handler: 'generateDocument',
    environment: {
      DYNAMODB_TABLE_NAME: dynamoDbTable.tableName,
      S3_BUCKET: s3BucketName,
      DELETE_EXPIRED_S3_OBJECTS_QUEUE_URL: sqsQueues.deleteExpiredS3ObjectsQueue.queueUrl,
      ...envVars.get(Lambda.generateDocument),
    },
  });

  const deleteExpiredS3Objects = new NodejsFunction(scope, Lambda.deleteExpiredS3Objects, {
    ...getCommonNodeJsFunctionProps({
      lambda: Lambda.deleteExpiredS3Objects,
      cdkEnvVars,
      retainStatefulResources,
    }),
    handler: 'deleteExpiredS3Objects',
    environment: {
      S3_BUCKET: s3BucketName,
      ...envVars.get(Lambda.deleteExpiredS3Objects),
    },
  });

  return {
    getOpenApi,
    getUrlForTemplateUpload,
    createTemplate,
    getTemplate,
    getTemplates,
    deleteTemplate,
    setDefaultUserPassword,
    generateDocument,
    deleteExpiredS3Objects,
  };
}
