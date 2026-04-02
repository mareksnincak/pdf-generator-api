import {
  AdminSetUserPasswordCommand,
  CognitoIdentityProviderClient,
} from '@aws-sdk/client-cognito-identity-provider';
import type {
  CloudFormationCustomResourceEvent,
  CloudFormationCustomResourceFailedResponse,
  CloudFormationCustomResourceResponse,
  CloudFormationCustomResourceSuccessResponse,
} from 'aws-lambda';

import { ErrorFormat } from '../../helpers/error.helper';
import { wrapHandler } from '../../helpers/handler.helper';
import { logger } from '../../helpers/logger.helper';
import { getSecret } from '../../helpers/secret-manager.helper';

import {
  type SetDefaultUserPasswordResourceCustomProperties,
  type SetDefaultUserPasswordResourceProperties,
} from './types/properties.type';
import { type UserCredentialsSecret } from './types/secret.type';

const cognitoIdentityProviderClient = new CognitoIdentityProviderClient();

async function onCreate({
  userCredentialsSecretName,
  userPoolId,
}: SetDefaultUserPasswordResourceCustomProperties) {
  logger.info('setDefaultUserPassword.onCreate');

  const rawUserCredentials = await getSecret(userCredentialsSecretName);
  const userCredentials = JSON.parse(rawUserCredentials) as UserCredentialsSecret;

  await cognitoIdentityProviderClient.send(
    new AdminSetUserPasswordCommand({
      Password: userCredentials.password,
      Permanent: true,
      Username: userCredentials.username,
      UserPoolId: userPoolId,
    }),
  );

  logger.info('setDefaultUserPassword.onCreate.success');
}

async function handler(
  event: CloudFormationCustomResourceEvent,
): Promise<CloudFormationCustomResourceResponse> {
  logger.info(event, 'setDefaultUserPassword.event');

  const resourceProperties = event.ResourceProperties as SetDefaultUserPasswordResourceProperties;

  const commonResponse: Omit<CloudFormationCustomResourceResponse, 'Status'> = {
    LogicalResourceId: event.LogicalResourceId,
    PhysicalResourceId: resourceProperties.physicalResourceId,
    RequestId: event.RequestId,
    StackId: event.StackId,
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
      Reason: reason,
      Status: 'FAILED',
    };
    logger.info(response, 'setDefaultUserPassword.response');
    return response;
  }
}

export const setDefaultUserPassword = wrapHandler(handler, {
  errorFormat: ErrorFormat.RAW,
  logPrefix: 'setDefaultUserPassword',
});
