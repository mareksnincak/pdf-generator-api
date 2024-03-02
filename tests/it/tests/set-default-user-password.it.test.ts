import {
  AdminSetUserPasswordCommand,
  CognitoIdentityProviderClient,
} from '@aws-sdk/client-cognito-identity-provider';
import { GetSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager';

import { EnvironmentName } from '../../../config/enums/config.enum';
import { setEnvVarsFromConfig } from '../../../config/helpers/config.helper';
import { Lambda } from '../../../infra/cdk/enums/lambda.enum';
import { setDefaultUserPassword } from '../../../src/lambdas/set-default-user-password/handler';
import { CloudFormationCustomResourceEventMockFactory } from '../../../src/lambdas/set-default-user-password/mock-factories/event.mock-factory';
import { ContextMockFactory } from '../../../src/mock-factories/context.mock-factory';

const eventMockFactory = new CloudFormationCustomResourceEventMockFactory();
const context = new ContextMockFactory().create();

beforeAll(() => {
  setEnvVarsFromConfig(EnvironmentName.localTest, Lambda.getUrlForTemplateUpload);
});

afterEach(() => {
  jest.resetAllMocks();
});

describe('setDefaultUserPassword', () => {
  it('should set default user password on create', async () => {
    const userCredentials = { username: 'sample-username', password: 'sample-password' };
    const secretManagerSpy = jest
      .spyOn(SecretsManagerClient.prototype, 'send')
      .mockImplementation(() => ({
        SecretString: JSON.stringify(userCredentials),
      }));

    const cognitoIdentityProviderClientSpy = jest
      .spyOn(CognitoIdentityProviderClient.prototype, 'send')
      .mockImplementation();

    const event = eventMockFactory.create({
      RequestType: 'Create',
    });

    const result = await setDefaultUserPassword(event, context);

    expect(result).toEqual({
      LogicalResourceId: event.LogicalResourceId,
      PhysicalResourceId: event.ResourceProperties.physicalResourceId,
      RequestId: event.RequestId,
      StackId: event.StackId,
      Status: 'SUCCESS',
    });

    const secretManagerArgs = secretManagerSpy.mock.calls[0][0];
    expect(secretManagerArgs).toBeInstanceOf(GetSecretValueCommand);
    expect(secretManagerArgs.input).toEqual({
      SecretId: event.ResourceProperties.userCredentialsSecretName,
    });

    const cognitoIdentityProviderClientArgs = cognitoIdentityProviderClientSpy.mock.calls[0][0];
    expect(cognitoIdentityProviderClientArgs).toBeInstanceOf(AdminSetUserPasswordCommand);
    expect(cognitoIdentityProviderClientArgs.input).toEqual({
      Password: userCredentials.password,
      Permanent: true,
      UserPoolId: event.ResourceProperties.userPoolId,
      Username: userCredentials.username,
    });
  });
});
