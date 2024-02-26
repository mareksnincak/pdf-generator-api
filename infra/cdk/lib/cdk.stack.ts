import path = require('path');

import { Duration, Stack } from 'aws-cdk-lib';
import { Architecture, Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

import { Lambda } from '../enums/lambda.enum';

import type { StackProps } from 'aws-cdk-lib';
import type { Construct } from 'constructs';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway';

export class CdkStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const uploadTemplate = new NodejsFunction(this, Lambda.uploadTemplate, {
      runtime: Runtime.NODEJS_20_X,
      architecture: Architecture.ARM_64,
      handler: 'uploadTemplate',
      entry: path.join(__dirname, '../../../src/lambdas/upload-template/upload-template.ts'),
      bundling: {
        assetHash: Lambda.uploadTemplate,
      },
      logRetention: RetentionDays.ONE_YEAR,
      timeout: Duration.minutes(1),
      environment: {
        DYNAMODB_ENDPOINT: 'http://host.docker.internal:8000',
        DYNAMODB_TABLE_NAME: 'PdfGenerator',
      },
    });

    const api = new RestApi(this, 'api', {
      cloudWatchRole: false,
    });

    const scrapersResource = api.root.addResource('templates');
    scrapersResource.addMethod('POST', new LambdaIntegration(uploadTemplate));
  }
}
