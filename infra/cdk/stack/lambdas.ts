import { join } from 'node:path';

import { Duration } from 'aws-cdk-lib';
import { type Table } from 'aws-cdk-lib/aws-dynamodb';
import { Architecture, Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { type Construct } from 'constructs';

import { getEnvVars } from '../../../config/helpers/config.helper';
import { type CdkEnvVarsDto } from '../dtos/cdk-env-vars.dto';
import { Lambda } from '../enums/lambda.enum';

function getLambdaEntryPath(lambda: Lambda) {
  return join(__dirname, '..', '..', '..', 'src', 'lambdas', lambda, 'handler.ts');
}

function getCommonNodeJsFunctionProps(lambda: Lambda, cdkEnvVars: CdkEnvVarsDto) {
  return {
    runtime: Runtime.NODEJS_20_X,
    architecture: Architecture.ARM_64,
    entry: getLambdaEntryPath(lambda),
    bundling: {
      /**
       * We are using static hash to be able to use local watch.
       * We need dynamic hash for deploy as otherwise cdk won't pick
       * up new lambda changes
       */
      assetHash: cdkEnvVars.FORCE_STATIC_HASH ? lambda : undefined,
    },
    logRetention: RetentionDays.ONE_YEAR,
    timeout: Duration.seconds(30),
  };
}

export function createLambdas({
  scope,
  cdkEnvVars,
  openApiParamsSsmParamName,
  s3BucketName,
  dynamoDbTable,
}: {
  scope: Construct;
  cdkEnvVars: CdkEnvVarsDto;
  openApiParamsSsmParamName: string;
  s3BucketName: string;
  dynamoDbTable: Table;
}) {
  const envVars = getEnvVars(cdkEnvVars.ENVIRONMENT_NAME);

  const getOpenApi = new NodejsFunction(scope, Lambda.getOpenApi, {
    ...getCommonNodeJsFunctionProps(Lambda.getOpenApi, cdkEnvVars),
    handler: 'getOpenApi',
    environment: {
      OPEN_API_SSM_PARAM_NAME: openApiParamsSsmParamName,
      ...envVars.get(Lambda.getOpenApi),
    },
  });

  const getUrlForTemplateUpload = new NodejsFunction(scope, Lambda.getUrlForTemplateUpload, {
    ...getCommonNodeJsFunctionProps(Lambda.getUrlForTemplateUpload, cdkEnvVars),
    handler: 'getUrlForTemplateUpload',
    environment: {
      S3_BUCKET: s3BucketName,
      ...envVars.get(Lambda.getUrlForTemplateUpload),
    },
  });

  const createTemplate = new NodejsFunction(scope, Lambda.createTemplate, {
    ...getCommonNodeJsFunctionProps(Lambda.createTemplate, cdkEnvVars),
    handler: 'createTemplate',
    environment: {
      DYNAMODB_TABLE_NAME: dynamoDbTable.tableName,
      S3_BUCKET: s3BucketName,
      ...envVars.get(Lambda.createTemplate),
    },
  });

  const getTemplate = new NodejsFunction(scope, Lambda.getTemplate, {
    ...getCommonNodeJsFunctionProps(Lambda.getTemplate, cdkEnvVars),
    handler: 'getTemplate',
    environment: {
      DYNAMODB_TABLE_NAME: dynamoDbTable.tableName,
      S3_BUCKET: s3BucketName,
      ...envVars.get(Lambda.getTemplate),
    },
  });

  const deleteTemplate = new NodejsFunction(scope, Lambda.deleteTemplate, {
    ...getCommonNodeJsFunctionProps(Lambda.deleteTemplate, cdkEnvVars),
    handler: 'deleteTemplate',
    environment: {
      DYNAMODB_TABLE_NAME: dynamoDbTable.tableName,
      S3_BUCKET: s3BucketName,
      ...envVars.get(Lambda.deleteTemplate),
    },
  });

  const setDefaultUserPassword = new NodejsFunction(scope, Lambda.setDefaultUserPassword, {
    ...getCommonNodeJsFunctionProps(Lambda.setDefaultUserPassword, cdkEnvVars),
    handler: 'setDefaultUserPassword',
    environment: {
      ...envVars.get(Lambda.setDefaultUserPassword),
    },
  });

  return {
    getOpenApi,
    getUrlForTemplateUpload,
    createTemplate,
    getTemplate,
    deleteTemplate,
    setDefaultUserPassword,
  };
}
