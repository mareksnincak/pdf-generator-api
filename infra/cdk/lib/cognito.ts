import { randomBytes } from 'node:crypto';

import { CfnUserPoolUser, UserPool, UserPoolClient } from 'aws-cdk-lib/aws-cognito';
import {
  AwsCustomResource,
  AwsCustomResourcePolicy,
  PhysicalResourceId,
} from 'aws-cdk-lib/custom-resources';
import { type Construct } from 'constructs';

export type UserCredentials = {
  email: string;
  password: string;
};

export function createCognito(scope: Construct, stackId: string) {
  const userPool = new UserPool(scope, 'user-pool', {
    userPoolName: stackId,
    selfSignUpEnabled: false,
  });

  const userPoolClient = new UserPoolClient(scope, 'user-pool-client', {
    userPool,
    userPoolClientName: stackId,
    authFlows: {
      userSrp: true,
    },
    preventUserExistenceErrors: true,
  });

  const defaultUserCredentials: UserCredentials = {
    email: 'default-user@example.com',
    password: `P4ssw0rd.${randomBytes(8).toString('hex')}`,
  };

  new CfnUserPoolUser(scope, 'default-user', {
    userPoolId: userPool.userPoolId,
    username: defaultUserCredentials.email,
    userAttributes: [
      { name: 'email', value: defaultUserCredentials.email },
      { name: 'email_verified', value: 'true' },
    ],
    desiredDeliveryMediums: ['EMAIL'],
  });

  new AwsCustomResource(scope, 'set-default-user-password', {
    onCreate: {
      service: 'CognitoIdentityServiceProvider',
      action: 'adminSetUserPassword',
      parameters: {
        UserPoolId: userPool.userPoolId,
        Username: defaultUserCredentials.email,
        Password: defaultUserCredentials.password,
        Permanent: true,
      },
      physicalResourceId: PhysicalResourceId.of('set-default-user-password'),
    },
    policy: AwsCustomResourcePolicy.fromSdkCalls({
      resources: AwsCustomResourcePolicy.ANY_RESOURCE,
    }),
  });

  // new CfnOutput(this, 'userPoolId', {
  //   value: userPool.userPoolId,
  // });

  // new CfnOutput(this, 'userPoolClientId', {
  //   value: userPoolClient.userPoolClientId,
  // });
  return { userPool, userPoolClient, defaultUserCredentials };
}
