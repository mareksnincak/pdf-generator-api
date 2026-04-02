import { type RestApi } from 'aws-cdk-lib/aws-apigateway';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { type Construct } from 'constructs';

import { type OpenApiParamsSsmParam } from '../../../src/lambdas/get-open-api/types/input.type';

import { type createCognito } from './cognito';

export function getStringParameters({ scope, stackId }: { scope: Construct; stackId: string }) {
  const sentryDsn = StringParameter.fromStringParameterName(
    scope,
    'sentry-dsn',
    `${stackId}-sentry-dsn`,
  );

  return {
    sentryDsn: sentryDsn.stringValue,
  };
}

export function createStringParameters({
  api,
  cognito,
  openApiParamsSsmParamName,
  scope,
}: {
  api: RestApi;
  cognito: ReturnType<typeof createCognito>;
  openApiParamsSsmParamName: string;
  scope: Construct;
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
