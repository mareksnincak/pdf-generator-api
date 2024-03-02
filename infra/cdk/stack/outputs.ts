import { CfnOutput } from 'aws-cdk-lib';
import { type RestApi } from 'aws-cdk-lib/aws-apigateway';
import { type Construct } from 'constructs';

import { type createCognito } from './cognito';

export function createOutputs({
  scope,
  api,
  cognito,
}: {
  scope: Construct;
  api: RestApi;
  cognito: ReturnType<typeof createCognito>;
}) {
  new CfnOutput(scope, 'apiUrl', {
    value: api.url,
  });

  new CfnOutput(scope, 'userPoolId', {
    value: cognito.userPool.userPoolId,
  });

  new CfnOutput(scope, 'userPoolClientId', {
    value: cognito.userPoolClient.userPoolClientId,
  });

  new CfnOutput(scope, 'defaultUserCredentialsSecretName', {
    value: cognito.defaultUsersCredentialsSecret.secretName,
  });
}
