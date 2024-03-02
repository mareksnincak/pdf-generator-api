import {
  AdminInitiateAuthCommand,
  AuthFlowType,
  CognitoIdentityProviderClient,
} from '@aws-sdk/client-cognito-identity-provider';

export async function getAccessToken(isLocalhost: boolean) {
  if (isLocalhost) {
    return '';
  }

  const { E2E_AUTH_USER_POOL_ID, E2E_AUTH_CLIENT_ID, E2E_AUTH_USERNAME, E2E_AUTH_PASSWORD } =
    process.env;

  if (!E2E_AUTH_USER_POOL_ID || !E2E_AUTH_CLIENT_ID || !E2E_AUTH_USERNAME || !E2E_AUTH_PASSWORD) {
    throw new Error('e2eSetupHelper.getAccessToken.missingEnvVariables');
  }

  const client = new CognitoIdentityProviderClient();
  const response = await client.send(
    new AdminInitiateAuthCommand({
      UserPoolId: E2E_AUTH_USER_POOL_ID,
      ClientId: E2E_AUTH_CLIENT_ID,
      AuthFlow: AuthFlowType.ADMIN_USER_PASSWORD_AUTH,
      AuthParameters: {
        USERNAME: E2E_AUTH_USERNAME,
        PASSWORD: E2E_AUTH_PASSWORD,
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
