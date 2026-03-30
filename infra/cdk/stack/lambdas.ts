import path from 'node:path';

import { Duration, RemovalPolicy } from 'aws-cdk-lib';
import { type Table } from 'aws-cdk-lib/aws-dynamodb';
import { type Key } from 'aws-cdk-lib/aws-kms';
import { Architecture, Runtime } from 'aws-cdk-lib/aws-lambda';
import {
  type BundlingOptions,
  NodejsFunction,
  type NodejsFunctionProps,
} from 'aws-cdk-lib/aws-lambda-nodejs';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { type Construct } from 'constructs';

import { getEnvVars } from '../../../config/helpers/config.helper';
import { type CdkEnvVarsDto } from '../dtos/cdk-env-vars.dto';
import { Lambda } from '../enums/lambda.enum';

import { type createStateMachines } from './sfn';
import { type createSqsQueues } from './sqs';

function getLambdaEntryPath(lambdaDirName: Lambda | string, handlerFilename = 'handler.ts') {
  return path.join(__dirname, '..', '..', '..', 'src', 'lambdas', lambdaDirName, handlerFilename);
}

function getCommonNodeJsFunctionProps({
  architecture = Architecture.ARM_64,
  bundlingOptions,
  cdkEnvVars,
  handlerFilename,
  lambda,
  lambdaDirName,
  memorySize,
  retainStatefulResources,
  scope,
}: {
  architecture?: Architecture;
  bundlingOptions?: BundlingOptions;
  cdkEnvVars: CdkEnvVarsDto;
  handlerFilename?: string;
  lambda: Lambda;
  lambdaDirName?: string;
  memorySize?: number;
  retainStatefulResources: boolean;
  scope: Construct;
}) {
  const logGroup = new LogGroup(scope, `${lambda}-log-group`, {
    removalPolicy: RemovalPolicy.DESTROY, // This matches Lambda's default for auto-created log groups
    retention: retainStatefulResources ? RetentionDays.ONE_MONTH : RetentionDays.ONE_DAY,
  });

  return {
    architecture,
    bundling: {
      /**
       * We are using static hash to be able to use local watch.
       * We need dynamic hash for deploy as otherwise cdk won't pick
       * up new lambda changes
       */
      assetHash: cdkEnvVars.FORCE_STATIC_HASH ? lambda : undefined,
      ...bundlingOptions,
    },
    entry: getLambdaEntryPath(lambdaDirName ?? lambda, handlerFilename),
    logGroup,
    memorySize,
    runtime: Runtime.NODEJS_24_X,
    timeout: Duration.seconds(30),
  } satisfies NodejsFunctionProps;
}

export function createLambdas({
  cdkEnvVars,
  dynamoDbTable,
  kmsKey,
  openApiParamsSsmParamName,
  retainStatefulResources,
  s3BucketName,
  scope,
  sqsQueues,
}: {
  cdkEnvVars: CdkEnvVarsDto;
  dynamoDbTable: Table;
  kmsKey: Key;
  openApiParamsSsmParamName: string;
  retainStatefulResources: boolean;
  s3BucketName: string;
  scope: Construct;
  sqsQueues: ReturnType<typeof createSqsQueues>;
}) {
  const envVars = getEnvVars(cdkEnvVars.ENVIRONMENT_NAME);

  const getOpenApi = new NodejsFunction(scope, Lambda.getOpenApi, {
    ...getCommonNodeJsFunctionProps({
      cdkEnvVars,
      lambda: Lambda.getOpenApi,
      retainStatefulResources,
      scope,
    }),
    environment: {
      OPEN_API_SSM_PARAM_NAME: openApiParamsSsmParamName,
      ...envVars.get(Lambda.getOpenApi),
    },
    handler: 'getOpenApi',
  });

  const getUrlForTemplateUpload = new NodejsFunction(scope, Lambda.getUrlForTemplateUpload, {
    ...getCommonNodeJsFunctionProps({
      cdkEnvVars,
      lambda: Lambda.getUrlForTemplateUpload,
      retainStatefulResources,
      scope,
    }),
    environment: {
      DELETE_EXPIRED_S3_OBJECTS_QUEUE_URL: sqsQueues.deleteExpiredS3ObjectsQueue.queueUrl,
      S3_BUCKET: s3BucketName,
      ...envVars.get(Lambda.getUrlForTemplateUpload),
    },
    handler: 'getUrlForTemplateUpload',
  });

  const createTemplate = new NodejsFunction(scope, Lambda.createTemplate, {
    ...getCommonNodeJsFunctionProps({
      cdkEnvVars,
      lambda: Lambda.createTemplate,
      retainStatefulResources,
      scope,
    }),
    environment: {
      DYNAMODB_TABLE_NAME: dynamoDbTable.tableName,
      S3_BUCKET: s3BucketName,
      ...envVars.get(Lambda.createTemplate),
    },
    handler: 'createTemplate',
  });

  const getTemplate = new NodejsFunction(scope, Lambda.getTemplate, {
    ...getCommonNodeJsFunctionProps({
      cdkEnvVars,
      lambda: Lambda.getTemplate,
      retainStatefulResources,
      scope,
    }),
    environment: {
      DYNAMODB_TABLE_NAME: dynamoDbTable.tableName,
      S3_BUCKET: s3BucketName,
      ...envVars.get(Lambda.getTemplate),
    },
    handler: 'getTemplate',
  });

  const getTemplates = new NodejsFunction(scope, Lambda.getTemplates, {
    ...getCommonNodeJsFunctionProps({
      cdkEnvVars,
      lambda: Lambda.getTemplates,
      retainStatefulResources,
      scope,
    }),
    environment: {
      DYNAMODB_TABLE_NAME: dynamoDbTable.tableName,
      KMS_KEY_ID: kmsKey.keyId,
      ...envVars.get(Lambda.getTemplates),
    },
  });

  const deleteTemplate = new NodejsFunction(scope, Lambda.deleteTemplate, {
    ...getCommonNodeJsFunctionProps({
      cdkEnvVars,
      lambda: Lambda.deleteTemplate,
      retainStatefulResources,
      scope,
    }),
    environment: {
      DYNAMODB_TABLE_NAME: dynamoDbTable.tableName,
      ...envVars.get(Lambda.deleteTemplate),
    },
    handler: 'deleteTemplate',
  });

  const setDefaultUserPassword = new NodejsFunction(scope, Lambda.setDefaultUserPassword, {
    ...getCommonNodeJsFunctionProps({
      cdkEnvVars,
      lambda: Lambda.setDefaultUserPassword,
      retainStatefulResources,
      scope,
    }),
    environment: {
      ...envVars.get(Lambda.setDefaultUserPassword),
    },
    handler: 'setDefaultUserPassword',
  });

  const generateDocumentFromApiEvent = new NodejsFunction(
    scope,
    Lambda.generateDocumentFromApiEvent,
    {
      ...getCommonNodeJsFunctionProps({
        architecture: Architecture.X86_64,
        bundlingOptions: {
          nodeModules: ['@sparticuz/chromium'],
        },
        cdkEnvVars,
        handlerFilename: 'api-handler.ts',
        lambda: Lambda.generateDocumentFromApiEvent,
        lambdaDirName: 'generate-document',
        memorySize: 2048,
        retainStatefulResources,
        scope,
      }),
      environment: {
        DELETE_EXPIRED_S3_OBJECTS_QUEUE_URL: sqsQueues.deleteExpiredS3ObjectsQueue.queueUrl,
        DYNAMODB_TABLE_NAME: dynamoDbTable.tableName,
        S3_BUCKET: s3BucketName,
        ...envVars.get(Lambda.generateDocumentFromApiEvent),
      },
      handler: 'generateDocumentFromApiEvent',
    },
  );

  const generateDocumentFromSfnEvent = new NodejsFunction(
    scope,
    Lambda.generateDocumentFromSfnEvent,
    {
      ...getCommonNodeJsFunctionProps({
        architecture: Architecture.X86_64,
        bundlingOptions: {
          nodeModules: ['@sparticuz/chromium'],
        },
        cdkEnvVars,
        handlerFilename: 'sfn-handler.ts',
        lambda: Lambda.generateDocumentFromSfnEvent,
        lambdaDirName: 'generate-document',
        memorySize: 2048,
        retainStatefulResources,
        scope,
      }),
      environment: {
        DYNAMODB_TABLE_NAME: dynamoDbTable.tableName,
        S3_BUCKET: s3BucketName,
        ...envVars.get(Lambda.generateDocumentFromSfnEvent),
      },
      handler: 'generateDocumentFromSfnEvent',
    },
  );

  const getDocumentBatchResult = new NodejsFunction(scope, Lambda.getDocumentBatchResult, {
    ...getCommonNodeJsFunctionProps({
      cdkEnvVars,
      lambda: Lambda.getDocumentBatchResult,
      retainStatefulResources,
      scope,
    }),
    environment: {
      DYNAMODB_TABLE_NAME: dynamoDbTable.tableName,
      S3_BUCKET: s3BucketName,
      ...envVars.get(Lambda.getDocumentBatchResult),
    },
    handler: 'getDocumentBatchResult',
  });

  const storeDocumentBatchResult = new NodejsFunction(scope, Lambda.storeDocumentBatchResult, {
    ...getCommonNodeJsFunctionProps({
      cdkEnvVars,
      lambda: Lambda.storeDocumentBatchResult,
      retainStatefulResources,
      scope,
    }),
    environment: {
      DYNAMODB_TABLE_NAME: dynamoDbTable.tableName,
      ...envVars.get(Lambda.storeDocumentBatchResult),
    },
    handler: 'storeDocumentBatchResult',
  });

  const deleteExpiredS3Objects = new NodejsFunction(scope, Lambda.deleteExpiredS3Objects, {
    ...getCommonNodeJsFunctionProps({
      cdkEnvVars,
      lambda: Lambda.deleteExpiredS3Objects,
      retainStatefulResources,
      scope,
    }),
    environment: {
      S3_BUCKET: s3BucketName,
      ...envVars.get(Lambda.deleteExpiredS3Objects),
    },
    handler: 'deleteExpiredS3Objects',
  });

  const deleteOrphanedS3Objects = new NodejsFunction(scope, Lambda.deleteOrphanedS3Objects, {
    ...getCommonNodeJsFunctionProps({
      cdkEnvVars,
      lambda: Lambda.deleteOrphanedS3Objects,
      retainStatefulResources,
      scope,
    }),
    environment: {
      S3_BUCKET: s3BucketName,
      ...envVars.get(Lambda.deleteOrphanedS3Objects),
    },
    handler: 'deleteOrphanedS3Objects',
  });

  return {
    createTemplate,
    deleteExpiredS3Objects,
    deleteOrphanedS3Objects,
    deleteTemplate,
    generateDocumentFromApiEvent,
    generateDocumentFromSfnEvent,
    getDocumentBatchResult,
    getOpenApi,
    getTemplate,
    getTemplates,
    getUrlForTemplateUpload,
    setDefaultUserPassword,
    storeDocumentBatchResult,
  };
}

/**
 * As state machines use lambdas they need to be created before
 * creating step function. Lambdas that start state machine need
 * state machine ARN therefore we create them separately later.
 */
export function createStateMachineStartupLambdas({
  cdkEnvVars,
  dynamoDbTable,
  retainStatefulResources,
  scope,
  stateMachines,
}: {
  cdkEnvVars: CdkEnvVarsDto;
  dynamoDbTable: Table;
  retainStatefulResources: boolean;
  scope: Construct;
  stateMachines: ReturnType<typeof createStateMachines>;
}) {
  const envVars = getEnvVars(cdkEnvVars.ENVIRONMENT_NAME);

  const startDocumentBatchGeneration = new NodejsFunction(
    scope,
    Lambda.startDocumentBatchGeneration,
    {
      ...getCommonNodeJsFunctionProps({
        cdkEnvVars,
        lambda: Lambda.startDocumentBatchGeneration,
        retainStatefulResources,
        scope,
      }),
      environment: {
        DYNAMODB_TABLE_NAME: dynamoDbTable.tableName,
        STATE_MACHINE_ARN: stateMachines.documentBatchGeneration.stateMachineArn,
        ...envVars.get(Lambda.startDocumentBatchGeneration),
      },
      handler: 'startDocumentBatchGeneration',
    },
  );

  return {
    startDocumentBatchGeneration,
  };
}
