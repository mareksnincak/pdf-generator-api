import {
  AdminSetUserPasswordCommand,
  CognitoIdentityProviderClient,
} from '@aws-sdk/client-cognito-identity-provider';
import type {
  CloudFormationCustomResourceEvent,
  CloudFormationCustomResourceFailedResponse,
  CloudFormationCustomResourceResponse,
  CloudFormationCustomResourceSuccessResponse,
  Context,
} from 'aws-lambda';

import { logger, setLoggerContext } from '../../helpers/logger.helper';
import { getSecret } from '../../helpers/secret-manager.helper';

import {
  type SetDefaultUserPasswordResourceProperties,
  type SetDefaultUserPasswordResourceCustomProperties,
} from './types/properties.type';

const cognitoIdentityProviderClient = new CognitoIdentityProviderClient();

async function onCreate({
  userCredentialsSecretName,
  userPoolId,
}: SetDefaultUserPasswordResourceCustomProperties) {
  logger.info('setDefaultUserPassword.onCreate');

  const rawUserCredentials = await getSecret({ secretId: userCredentialsSecretName });
  const userCredentials = JSON.parse(rawUserCredentials) as { username: string; password: string };

  await cognitoIdentityProviderClient.send(
    new AdminSetUserPasswordCommand({
      UserPoolId: userPoolId,
      Username: userCredentials.username,
      Password: userCredentials.password,
      Permanent: true,
    }),
  );

  logger.info('setDefaultUserPassword.onCreate.success');
}

export async function setDefaultUserPassword(
  event: CloudFormationCustomResourceEvent,
  context: Context,
): Promise<CloudFormationCustomResourceResponse> {
  setLoggerContext(event, context);
  logger.info(event, 'setDefaultUserPassword.event');

  const resourceProperties = event.ResourceProperties as SetDefaultUserPasswordResourceProperties;

  const commonResponse: Omit<CloudFormationCustomResourceResponse, 'Status'> = {
    LogicalResourceId: event.LogicalResourceId,
    StackId: event.StackId,
    RequestId: event.RequestId,
    PhysicalResourceId: resourceProperties.physicalResourceId,
  };

  try {
    if (event.RequestType === 'Create') {
      await onCreate(resourceProperties);
    }

    const response: CloudFormationCustomResourceSuccessResponse = {
      ...commonResponse,
      Status: 'SUCCESS',
    };
    logger.info(response, 'setDefaultUserPassword.response');
    return response;
  } catch (error) {
    logger.error(error, 'setDefaultUserPassword.error');

    let reason = 'Unknown';
    if (error instanceof Error) {
      reason = error.message;
    }

    const response: CloudFormationCustomResourceFailedResponse = {
      ...commonResponse,
      Status: 'FAILED',
      Reason: reason,
    };
    logger.info(response, 'setDefaultUserPassword.response');
    return response;
  }
}
