import {
  AdminInitiateAuthCommand,
  AuthFlowType,
  CognitoIdentityProviderClient,
} from '@aws-sdk/client-cognito-identity-provider';

import { getSecret } from '../../../src/helpers/secret-manager.helper';
import { type UserCredentialsSecret } from '../../../src/lambdas/set-default-user-password/types/secret.type';

export async function getAccessToken(isLocalhost: boolean) {
  if (isLocalhost) {
    return '';
  }

  const {
    E2E_AUTH_USER_POOL_ID,
    E2E_AUTH_USER_POOL_CLIENT_ID,
    E2E_AUTH_USER_CREDENTIALS_SECRET_NAME,
  } = process.env;

  if (
    !E2E_AUTH_USER_POOL_ID ||
    !E2E_AUTH_USER_POOL_CLIENT_ID ||
    !E2E_AUTH_USER_CREDENTIALS_SECRET_NAME
  ) {
    throw new Error('e2eSetupHelper.getAccessToken.missingEnvVariables');
  }

  const rawCredentials = await getSecret(E2E_AUTH_USER_CREDENTIALS_SECRET_NAME);
  const credentials = JSON.parse(rawCredentials) as UserCredentialsSecret;

  const client = new CognitoIdentityProviderClient();
  const response = await client.send(
    new AdminInitiateAuthCommand({
      UserPoolId: E2E_AUTH_USER_POOL_ID,
      ClientId: E2E_AUTH_USER_POOL_CLIENT_ID,
      AuthFlow: AuthFlowType.ADMIN_USER_PASSWORD_AUTH,
      AuthParameters: {
        USERNAME: credentials.username,
        PASSWORD: credentials.password,
      },
    }),
  );

  const accessToken = response.AuthenticationResult?.AccessToken;
  if (!accessToken) {
    throw new Error('e2eSetupHelper.getAccessToken.missingToken');
  }

  return accessToken;
}

export async function getE2eSetup() {
  const isLocalhost = !process.env.E2E_BASE_URL;

  const baseUrl = process.env.E2E_BASE_URL ?? 'http://localhost:3000';
  const accessToken = await getAccessToken(isLocalhost);

  return {
    baseUrl,
    accessToken,
  };
}
