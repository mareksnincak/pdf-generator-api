import {
  AuthorizationType,
  CognitoUserPoolsAuthorizer,
  LambdaIntegration,
  RestApi,
} from 'aws-cdk-lib/aws-apigateway';
import { type Construct } from 'constructs';

import { oAuthScopes } from '../enums/authorization.enum';

import { type createCognito } from './cognito';
import { type createStateMachineStartupLambdas, type createLambdas } from './lambdas';

export function createApi({
  scope,
  lambdas,
  stateMachineStartupLambdas,
  cognito,
}: {
  scope: Construct;
  lambdas: ReturnType<typeof createLambdas>;
  stateMachineStartupLambdas: ReturnType<typeof createStateMachineStartupLambdas>;
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

  // TEMPLATES
  const templatesResource = api.root.addResource('templates');

  templatesResource
    .addResource('upload-url')
    .addMethod('GET', new LambdaIntegration(lambdas.getUrlForTemplateUpload), {
      ...commonAuthorizationOptions,
      authorizationScopes: [
        oAuthScopes.admin.pdfGeneratorScope,
        oAuthScopes.writeTemplates.pdfGeneratorName,
      ],
    });

  templatesResource.addMethod('POST', new LambdaIntegration(lambdas.createTemplate), {
    ...commonAuthorizationOptions,
    authorizationScopes: [
      oAuthScopes.admin.pdfGeneratorScope,
      oAuthScopes.writeTemplates.pdfGeneratorName,
    ],
  });

  templatesResource.addMethod('GET', new LambdaIntegration(lambdas.getTemplates), {
    ...commonAuthorizationOptions,
    authorizationScopes: [
      oAuthScopes.admin.pdfGeneratorScope,
      oAuthScopes.readTemplates.pdfGeneratorName,
    ],
  });

  const templateByIdResource = templatesResource.addResource('{id}');

  templateByIdResource.addMethod('GET', new LambdaIntegration(lambdas.getTemplate), {
    ...commonAuthorizationOptions,
    authorizationScopes: [
      oAuthScopes.admin.pdfGeneratorScope,
      oAuthScopes.readTemplates.pdfGeneratorName,
    ],
  });

  templateByIdResource.addMethod('DELETE', new LambdaIntegration(lambdas.deleteTemplate), {
    ...commonAuthorizationOptions,
    authorizationScopes: [
      oAuthScopes.admin.pdfGeneratorScope,
      oAuthScopes.writeTemplates.pdfGeneratorName,
    ],
  });

  // DOCUMENTS
  const documentResource = api.root.addResource('documents');

  documentResource
    .addResource('generate')
    .addMethod('POST', new LambdaIntegration(lambdas.generateDocument), {
      ...commonAuthorizationOptions,
      authorizationScopes: [
        oAuthScopes.admin.pdfGeneratorScope,
        oAuthScopes.generateDocuments.pdfGeneratorName,
      ],
    });

  const documentBatchResource = documentResource.addResource('batch');

  documentBatchResource
    .addResource('generate')
    .addMethod(
      'POST',
      new LambdaIntegration(stateMachineStartupLambdas.startDocumentBatchGeneration),
      {
        ...commonAuthorizationOptions,
        authorizationScopes: [
          oAuthScopes.admin.pdfGeneratorScope,
          oAuthScopes.generateDocuments.pdfGeneratorName,
        ],
      },
    );

  return api;
}
