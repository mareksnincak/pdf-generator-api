import { LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { type Construct } from 'constructs';
import { type createLambdas } from './lambdas';

export function createApi({
  scope,
  lambdas,
}: {
  scope: Construct;
  lambdas: ReturnType<typeof createLambdas>;
}) {
  const api = new RestApi(scope, 'api', {
    cloudWatchRole: false,
    deployOptions: {
      stageName: 'api',
    },
  });

  api.root.addMethod('GET', new LambdaIntegration(lambdas.getOpenApi));

  const templatesResource = api.root.addResource('templates');
  templatesResource.addMethod('POST', new LambdaIntegration(lambdas.createTemplate));
  templatesResource
    .addResource('upload-url')
    .addMethod('GET', new LambdaIntegration(lambdas.getUrlForTemplateUpload));

  return api;
}
