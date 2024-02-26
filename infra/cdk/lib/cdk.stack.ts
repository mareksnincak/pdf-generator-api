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
    handler: 'uploadTemplate',
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

    const getUrlForTemplateUpload = new NodejsFunction(this, Lambda.getUrlForTemplateUpload, {
      ...getCommonNodeJsFunctionProps(Lambda.getUrlForTemplateUpload),
      handler: 'getUrlForTemplateUpload',
      environment: {
        S3_BUCKET: 'test-local-pdf-generator-api' ?? s3Bucket.bucketName,
      },
    });

    const uploadTemplate = new NodejsFunction(this, Lambda.uploadTemplate, {
      ...getCommonNodeJsFunctionProps(Lambda.uploadTemplate),
      handler: 'uploadTemplate',
      environment: {
        DYNAMODB_ENDPOINT: 'http://host.docker.internal:8000',
        DYNAMODB_TABLE_NAME: 'PdfGenerator',
      },
    });

    s3Bucket.grantWrite(uploadTemplate);

    const api = new RestApi(this, 'api', {
      cloudWatchRole: false,
    });

    const templatesResource = api.root.addResource('templates');
    templatesResource.addMethod('POST', new LambdaIntegration(uploadTemplate));
    templatesResource
      .addResource('upload-url')
      .addMethod('GET', new LambdaIntegration(getUrlForTemplateUpload));
  }
}
