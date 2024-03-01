import { RemovalPolicy } from 'aws-cdk-lib';
import { CfnUserPoolUser, UserPool, UserPoolClient, UserPoolDomain } from 'aws-cdk-lib/aws-cognito';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import {
  AwsCustomResource,
  AwsCustomResourcePolicy,
  PhysicalResourceId,
} from 'aws-cdk-lib/custom-resources';
import { type Construct } from 'constructs';

export function createCognito(scope: Construct, stackId: string) {
  const userPool = new UserPool(scope, 'user-pool', {
    userPoolName: stackId,
    selfSignUpEnabled: false,
  });

  new UserPoolDomain(scope, 'user-pool-domain', {
    userPool,
    cognitoDomain: {
      domainPrefix: stackId,
    },
  });

  const userPoolClient = new UserPoolClient(scope, 'user-pool-client', {
    generateSecret: false,
    userPool,
    userPoolClientName: stackId,
    authFlows: {
      userSrp: true,
    },
    preventUserExistenceErrors: true,
  });

  const defaultUserUsername = 'default-user';

  const defaultUsersCredentialsSecret = new Secret(scope, 'default-user-credentials', {
    removalPolicy: RemovalPolicy.DESTROY,
    secretName: `${stackId}-default-user-credentials`,
    generateSecretString: {
      secretStringTemplate: JSON.stringify({ username: defaultUserUsername }),
      generateStringKey: 'password',
      passwordLength: 16,
      requireEachIncludedType: true,
    },
  });

  new CfnUserPoolUser(scope, 'default-user', {
    userPoolId: userPool.userPoolId,
    username: defaultUserUsername,
    userAttributes: [
      { name: 'email', value: 'default-user@example.com' },
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
        Username: defaultUserUsername,
        Password: defaultUsersCredentialsSecret.secretValueFromJson('password').unsafeUnwrap(),
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
  return { userPool, userPoolClient, defaultUsersCredentialsSecret };
}
