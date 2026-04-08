import {
  AdminSetUserPasswordCommand,
  CognitoIdentityProviderClient,
} from '@aws-sdk/client-cognito-identity-provider';

import { EnvironmentName } from '../../../config/enums/config.enum';
import { setEnvVarsFromConfig } from '../../../config/helpers/config.helper';
import { Lambda } from '../../../infra/cdk/enums/lambda.enum';
import { setDefaultUserPassword } from '../../../src/lambdas/set-default-user-password/handler';
import { CloudFormationCustomResourceEventMockFactory } from '../../../src/lambdas/set-default-user-password/mock-factories/event.mock-factory';
import { ContextMockFactory } from '../../../src/mock-factories/context.mock-factory';
import { mockAwsCredentials } from '../helpers/credential.helper';
import { createSecret } from '../helpers/secret-manager.helper';

const eventMockFactory = new CloudFormationCustomResourceEventMockFactory();
const context = new ContextMockFactory().create();

beforeAll(() => {
  setEnvVarsFromConfig(EnvironmentName.localTest, Lambda.setDefaultUserPassword);
  mockAwsCredentials();
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('setDefaultUserPassword', () => {
  it('should set default user password on create', async () => {
    const userCredentials = { password: 'sample-password', username: 'sample-username' };
    const secretName = 'test-user-credentials-secret';

    await createSecret(secretName, JSON.stringify(userCredentials));

    const cognitoIdentityProviderClientSpy = jest
      .spyOn(CognitoIdentityProviderClient.prototype, 'send')
      .mockImplementation();

    const event = eventMockFactory.create({
      RequestType: 'Create',
      ResourceProperties: {
        userCredentialsSecretName: secretName,
      },
    });

    const result = await setDefaultUserPassword(event, context);

    expect(result).toEqual({
      LogicalResourceId: event.LogicalResourceId,
      PhysicalResourceId: event.ResourceProperties.physicalResourceId,
      RequestId: event.RequestId,
      StackId: event.StackId,
      Status: 'SUCCESS',
    });

    const cognitoIdentityProviderClientArgs = cognitoIdentityProviderClientSpy.mock.calls[0][0];
    expect(cognitoIdentityProviderClientArgs).toBeInstanceOf(AdminSetUserPasswordCommand);
    expect(cognitoIdentityProviderClientArgs.input).toEqual({
      Password: userCredentials.password,
      Permanent: true,
      Username: userCredentials.username,
      UserPoolId: event.ResourceProperties.userPoolId,
    });
  });
});
