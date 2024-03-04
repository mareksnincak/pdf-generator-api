import { CfnOutput } from 'aws-cdk-lib';
import { type RestApi } from 'aws-cdk-lib/aws-apigateway';
import { type Construct } from 'constructs';

import { type createCognito } from './cognito';
import { type createSqsQueues } from './sqs';

export function createOutputs({
  scope,
  api,
  cognito,
  sqsQueues,
}: {
  scope: Construct;
  api: RestApi;
  cognito: ReturnType<typeof createCognito>;
  sqsQueues: ReturnType<typeof createSqsQueues>;
}) {
  new CfnOutput(scope, 'apiUrl', {
    value: api.url,
  });

  new CfnOutput(scope, 'authUrl', {
    value: cognito.userPoolDomain.baseUrl(),
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

  new CfnOutput(scope, 'deleteExpiredS3ObjectsQueueUrl', {
    value: sqsQueues.deleteExpiredS3ObjectsQueue.queueUrl,
  });
}
