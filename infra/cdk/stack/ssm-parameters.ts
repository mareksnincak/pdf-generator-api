import { type RestApi } from 'aws-cdk-lib/aws-apigateway';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { type Construct } from 'constructs';

import { type OpenApiParamsSsmParam } from '../../../src/lambdas/get-open-api/types/input.type';

import { type createCognito } from './cognito';

export function createStringParameters({
  scope,
  api,
  openApiParamsSsmParamName,
  cognito,
}: {
  scope: Construct;
  api: RestApi;
  openApiParamsSsmParamName: string;
  cognito: ReturnType<typeof createCognito>;
}) {
  const openApiParams: OpenApiParamsSsmParam = {
    apiUrl: api.url,
    authUrl: `${cognito.userPoolDomain.baseUrl()}/login`,
  };

  new StringParameter(scope, 'open-api-params', {
    parameterName: openApiParamsSsmParamName,
    stringValue: JSON.stringify(openApiParams),
  });
}
