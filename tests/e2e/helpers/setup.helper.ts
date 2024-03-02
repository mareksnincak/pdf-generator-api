import {
  AdminInitiateAuthCommand,
  AuthFlowType,
  CognitoIdentityProviderClient,
} from '@aws-sdk/client-cognito-identity-provider';

import { getSecret } from '../../../src/helpers/secret-manager.helper';
import { validate } from '../../../src/helpers/validation.helper';
import { type UserCredentialsSecret } from '../../../src/lambdas/set-default-user-password/types/secret.type';
import { LOCAL_E2E_BASE_URL } from '../constants/url.constant';
import { type E2eEnvVarsDto, e2eEnvVarsDto } from '../dtos/env.dto';

export async function getAccessToken(envVars: E2eEnvVarsDto, isLocal: boolean) {
  if (isLocal) {
    return '';
  }

  const rawCredentials = await getSecret(envVars.E2E_AUTH_USER_CREDENTIALS_SECRET_NAME);
  const credentials = JSON.parse(rawCredentials) as UserCredentialsSecret;

  const client = new CognitoIdentityProviderClient();
  const response = await client.send(
    new AdminInitiateAuthCommand({
      UserPoolId: envVars.E2E_AUTH_USER_POOL_ID,
      ClientId: envVars.E2E_AUTH_USER_POOL_CLIENT_ID,
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
  const envVars = validate(process.env, e2eEnvVarsDto);
  const isLocal = envVars.E2E_BASE_URL === LOCAL_E2E_BASE_URL;

  if (isLocal) {
    process.env.IS_LOCAL = 'true';
  }

  const accessToken = await getAccessToken(envVars, isLocal);

  return {
    baseUrl: envVars.E2E_BASE_URL,
    accessToken,
  };
}
