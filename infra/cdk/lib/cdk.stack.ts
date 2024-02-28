import { Duration, Stack } from 'aws-cdk-lib';
import { Architecture, Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

import { Lambda } from '../enums/lambda.enum';

import type { StackProps } from 'aws-cdk-lib';
import type { Construct } from 'constructs';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { join } from 'path';
import { getEnvVars } from '../../../config/helpers/config.helper';
import { type EnvironmentName } from '../../../config/enums/config.enum';

function getLambdaEntryPath(lambda: Lambda) {
  return join(__dirname, '..', '..', '..', 'src', 'lambdas', lambda, `${lambda}.ts`);
}

function getCommonNodeJsFunctionProps(lambda: Lambda) {
  /**
   * We are using static hash to be able to use local watch.
   * We need dynamic hash for deploy as otherwise cdk won't pick
   * up new lambda changes
   */
  const forceStaticHash = process.env.FORCE_STATIC_HASH === 'true';

  return {
    runtime: Runtime.NODEJS_20_X,
    architecture: Architecture.ARM_64,
    entry: getLambdaEntryPath(lambda),
    bundling: {
      assetHash: forceStaticHash ? lambda : undefined,
    },
    logRetention: RetentionDays.ONE_YEAR,
    timeout: Duration.seconds(30),
  };
}

export class CdkStack extends Stack {
  constructor({
    scope,
    id,
    props,
    environmentName,
  }: {
    scope: Construct;
    id: string;
    props?: StackProps;
    environmentName: EnvironmentName;
  }) {
    super(scope, id, props);

    const envVars = getEnvVars(environmentName);

    const s3Bucket = new Bucket(this, 's3-bucket', {
      enforceSSL: true,
      bucketName: id,
    });

    const s3BucketName = s3Bucket.bucketName;
    const apiUrlSsmParamName = `${id}-api-url`;

    const getOpenApi = new NodejsFunction(this, Lambda.getOpenApi, {
      ...getCommonNodeJsFunctionProps(Lambda.getOpenApi),
      handler: 'getOpenApi',
      environment: {
        API_URL_SSM_PARAM_NAME: apiUrlSsmParamName,
        ...envVars.get(Lambda.getOpenApi),
      },
    });

    const getUrlForTemplateUpload = new NodejsFunction(this, Lambda.getUrlForTemplateUpload, {
      ...getCommonNodeJsFunctionProps(Lambda.getUrlForTemplateUpload),
      handler: 'getUrlForTemplateUpload',
      environment: {
        S3_BUCKET: s3BucketName,
        ...envVars.get(Lambda.getUrlForTemplateUpload),
      },
    });

    const createTemplate = new NodejsFunction(this, Lambda.createTemplate, {
      ...getCommonNodeJsFunctionProps(Lambda.createTemplate),
      handler: 'createTemplate',
      environment: {
        DYNAMODB_ENDPOINT: 'http://host.docker.internal:8000',
        DYNAMODB_TABLE_NAME: 'PdfGenerator',
        S3_BUCKET: s3BucketName,
        ...envVars.get(Lambda.createTemplate),
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

    api.root.addMethod('GET', new LambdaIntegration(getOpenApi));

    const templatesResource = api.root.addResource('templates');
    templatesResource.addMethod('POST', new LambdaIntegration(createTemplate));
    templatesResource
      .addResource('upload-url')
      .addMethod('GET', new LambdaIntegration(getUrlForTemplateUpload));

    new StringParameter(this, 'api-url', {
      parameterName: apiUrlSsmParamName,
      stringValue: api.url,
    });

    // We are using inline policy instead of ssmParam.grantRead() to not create circular dependency
    getOpenApi.addToRolePolicy(
      new PolicyStatement({
        resources: [`arn:aws:ssm:${this.region}:${this.account}:parameter/${apiUrlSsmParamName}`],
        actions: ['ssm:GetParameter'],
      }),
    );
  }
}
