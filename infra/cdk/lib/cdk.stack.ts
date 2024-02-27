import path = require('path');

import { Duration, Stack } from 'aws-cdk-lib';
import { Architecture, Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

import { Lambda } from '../enums/lambda.enum';

import type { StackProps } from 'aws-cdk-lib';
import type { Construct } from 'constructs';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { Bucket } from 'aws-cdk-lib/aws-s3';

function getLambdaEntryPath(lambda: Lambda) {
  return path.join(__dirname, '..', '..', '..', 'src', 'lambdas', lambda, `${lambda}.ts`);
}

function getCommonNodeJsFunctionProps(lambda: Lambda) {
  return {
    runtime: Runtime.NODEJS_20_X,
    architecture: Architecture.ARM_64,
    entry: getLambdaEntryPath(lambda),
    bundling: {
      assetHash: lambda,
    },
    logRetention: RetentionDays.ONE_YEAR,
    timeout: Duration.seconds(30),
  };
}

export class CdkStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const s3Bucket = new Bucket(this, 's3-bucket', {
      enforceSSL: true,
    });

    const s3BucketName = s3Bucket.bucketName;

    const getOpenApi = new NodejsFunction(this, Lambda.getOpenApi, {
      ...getCommonNodeJsFunctionProps(Lambda.getOpenApi),
      handler: 'getOpenApi',
    });

    const getUrlForTemplateUpload = new NodejsFunction(this, Lambda.getUrlForTemplateUpload, {
      ...getCommonNodeJsFunctionProps(Lambda.getUrlForTemplateUpload),
      handler: 'getUrlForTemplateUpload',
      environment: {
        S3_BUCKET: s3BucketName,
      },
    });

    const createTemplate = new NodejsFunction(this, Lambda.createTemplate, {
      ...getCommonNodeJsFunctionProps(Lambda.createTemplate),
      handler: 'createTemplate',
      environment: {
        DYNAMODB_ENDPOINT: 'http://host.docker.internal:8000',
        DYNAMODB_TABLE_NAME: 'PdfGenerator',
        S3_BUCKET: s3BucketName,
      },
    });

    s3Bucket.grantWrite(getUrlForTemplateUpload);
    s3Bucket.grantReadWrite(createTemplate);
    s3Bucket.grantDelete(createTemplate);

    const api = new RestApi(this, 'api', {
      cloudWatchRole: false,
      deployOptions: {
        stageName: 'api',
      },
    });

    api.root.addResource('open-api').addMethod('GET', new LambdaIntegration(getOpenApi));

    const templatesResource = api.root.addResource('templates');
    templatesResource.addMethod('POST', new LambdaIntegration(createTemplate));
    templatesResource
      .addResource('upload-url')
      .addMethod('GET', new LambdaIntegration(getUrlForTemplateUpload));
  }
}
