import { CfnOutput } from 'aws-cdk-lib';
import { type RestApi } from 'aws-cdk-lib/aws-apigateway';
import { type Construct } from 'constructs';

import { type createSsmParameters } from './ssm-parameters';

export function createOutputs({
  scope,
  api,
  ssmParameterNames,
}: {
  scope: Construct;
  api: RestApi;
  ssmParameterNames: ReturnType<typeof createSsmParameters>;
}) {
  new CfnOutput(scope, 'apiUrl', {
    value: api.url,
  });

  new CfnOutput(scope, 'defaultUserCredentialsSsmParamName', {
    value: ssmParameterNames.defaultUserCredentialsName,
  });
}
