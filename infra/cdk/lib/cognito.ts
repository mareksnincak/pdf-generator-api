import { CustomResource, RemovalPolicy } from 'aws-cdk-lib';
import { CfnUserPoolUser, UserPool, UserPoolClient, UserPoolDomain } from 'aws-cdk-lib/aws-cognito';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { PhysicalResourceId, Provider } from 'aws-cdk-lib/custom-resources';
import { type Construct } from 'constructs';

import { type createLambdas } from './lambdas';

export function createCognito({
  scope,
  stackId,
  lambdas,
}: {
  scope: Construct;
  stackId: string;
  lambdas: ReturnType<typeof createLambdas>;
}) {
  const userPool = new UserPool(scope, 'user-pool', {
    userPoolName: stackId,
    selfSignUpEnabled: false,
    removalPolicy: RemovalPolicy.RETAIN_ON_UPDATE_OR_DELETE,
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

  const user = new CfnUserPoolUser(scope, 'default-user', {
    userPoolId: userPool.userPoolId,
    username: defaultUserUsername,
    userAttributes: [
      { name: 'email', value: 'pdfgenerator.team@gmail.com' },
      { name: 'email_verified', value: 'true' },
    ],
    desiredDeliveryMediums: ['EMAIL'],
  });

  const setDefaultUserPasswordProvider = new Provider(scope, 'set-default-user-password-provider', {
    onEventHandler: lambdas.setDefaultUserPassword,
  });

  const setDefaultUserPasswordCustomResource = new CustomResource(
    scope,
    'set-default-user-password-custom-resource',
    {
      serviceToken: setDefaultUserPasswordProvider.serviceToken,
      properties: {
        physicalResourceId: PhysicalResourceId.of('set-default-user-password').id,
        userCredentialsSecretName: defaultUsersCredentialsSecret.secretName,
        userPoolId: userPool.userPoolId,
      },
    },
  );

  setDefaultUserPasswordCustomResource.node.addDependency(defaultUsersCredentialsSecret);
  setDefaultUserPasswordCustomResource.node.addDependency(user);

  return { userPool, userPoolClient, defaultUsersCredentialsSecret };
}
