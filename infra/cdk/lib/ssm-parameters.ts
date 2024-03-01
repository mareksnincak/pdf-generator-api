import { type RestApi } from 'aws-cdk-lib/aws-apigateway';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { type Construct } from 'constructs';

import { type UserCredentials } from './cognito';

export function createSsmParameters({
  scope,
  stackId,
  api,
  apiUrlSsmParamName,
  defaultUserCredentials,
}: {
  scope: Construct;
  stackId: string;
  api: RestApi;
  apiUrlSsmParamName: string;
  defaultUserCredentials: UserCredentials;
}) {
  new StringParameter(scope, 'api-url', {
    parameterName: apiUrlSsmParamName,
    stringValue: api.url,
  });

  const defaultUserCredentialsName = `${stackId}-default-user-credentials`;
  new StringParameter(scope, 'default-user-credentials', {
    parameterName: defaultUserCredentialsName,
    stringValue: JSON.stringify(defaultUserCredentials),
  });

  return { apiUrlSsmParamName, defaultUserCredentialsName };
}
