import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';

import { EnvironmentName } from '../../../config/enums/config.enum';
import { setEnvVarsFromConfig } from '../../../config/helpers/config.helper';
import { Lambda } from '../../../infra/cdk/enums/lambda.enum';
import * as secretManagerHelper from '../../helpers/secret-manager.helper';
import { mockLogger } from '../../helpers/test.helper';
import { ContextMockFactory } from '../../mock-factories/context.mock-factory';

import { setDefaultUserPassword } from './handler';
import { CloudFormationCustomResourceEventMockFactory } from './mock-factories/event.mock-factory';

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
    const userCredentialsSecret = { username: 'sample-username', password: 'sample-password' };
    jest
      .spyOn(secretManagerHelper, 'getSecret')
      .mockResolvedValue(JSON.stringify(userCredentialsSecret));

    jest.spyOn(CognitoIdentityProviderClient.prototype, 'send').mockImplementation();

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
  });

  it.each(['Update', 'Delete'])('should return SUCCESS on %s event', async (requestType) => {
    const event = eventMockFactory.create({
      RequestType: requestType as 'Update' | 'Delete',
    });

    const result = await setDefaultUserPassword(event, context);

    expect(result).toEqual({
      LogicalResourceId: event.LogicalResourceId,
      PhysicalResourceId: event.ResourceProperties.physicalResourceId,
      RequestId: event.RequestId,
      StackId: event.StackId,
      Status: 'SUCCESS',
    });
  });

  it('should return FAILED on error', async () => {
    mockLogger();

    const errorMsg = 'setDefaultUserPasswordTest.expectedError';
    jest.spyOn(secretManagerHelper, 'getSecret').mockImplementation(() => {
      throw new Error(errorMsg);
    });

    const event = eventMockFactory.create({
      RequestType: 'Create',
    });

    const result = await setDefaultUserPassword(event, context);

    expect(result).toEqual({
      LogicalResourceId: event.LogicalResourceId,
      PhysicalResourceId: event.ResourceProperties.physicalResourceId,
      Reason: errorMsg,
      RequestId: event.RequestId,
      StackId: event.StackId,
      Status: 'FAILED',
    });
  });
});
