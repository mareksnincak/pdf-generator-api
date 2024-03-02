import {
  AuthorizationType,
  CognitoUserPoolsAuthorizer,
  LambdaIntegration,
  RestApi,
} from 'aws-cdk-lib/aws-apigateway';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { type Construct } from 'constructs';

import { AuthorizationScope } from '../enums/authorization.enum';

import { type createCognito } from './cognito';
import { type createLambdas } from './lambdas';

export function createApi({
  scope,
  lambdas,
  apiUrlSsmParamName,
  cognito,
}: {
  scope: Construct;
  lambdas: ReturnType<typeof createLambdas>;
  apiUrlSsmParamName: string;
  cognito: ReturnType<typeof createCognito>;
}) {
  const api = new RestApi(scope, 'api', {
    cloudWatchRole: false,
    deployOptions: {
      stageName: 'api',
    },
  });

  const authorizer = new CognitoUserPoolsAuthorizer(scope, 'user-pool-authorizer', {
    cognitoUserPools: [cognito.userPool],
  });

  const commonAuthorizationOptions = {
    authorizer,
    authorizationType: AuthorizationType.COGNITO,
  } as const;

  api.root.addMethod('GET', new LambdaIntegration(lambdas.getOpenApi));

  const templatesResource = api.root.addResource('templates');

  templatesResource
    .addResource('upload-url')
    .addMethod('GET', new LambdaIntegration(lambdas.getUrlForTemplateUpload), {
      ...commonAuthorizationOptions,
      authorizationScopes: [AuthorizationScope.pdfGeneratorTemplateWrite],
    });

  templatesResource.addMethod('POST', new LambdaIntegration(lambdas.createTemplate), {
    ...commonAuthorizationOptions,
    authorizationScopes: [AuthorizationScope.pdfGeneratorTemplateWrite],
  });

  const templateByIdResource = templatesResource.addResource('{id}');
  templateByIdResource.addMethod('DELETE', new LambdaIntegration(lambdas.deleteTemplate), {
    ...commonAuthorizationOptions,
    authorizationScopes: [AuthorizationScope.pdfGeneratorTemplateWrite],
  });

  new StringParameter(scope, 'api-url', {
    parameterName: apiUrlSsmParamName,
    stringValue: api.url,
  });

  return api;
}
