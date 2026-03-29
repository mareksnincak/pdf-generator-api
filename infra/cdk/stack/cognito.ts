import { CustomResource, RemovalPolicy } from 'aws-cdk-lib';
import {
  CfnUserPoolUser,
  OAuthScope,
  type ResourceServerScope,
  UserPool,
  UserPoolClient,
  UserPoolDomain,
  UserPoolResourceServer,
} from 'aws-cdk-lib/aws-cognito';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { PhysicalResourceId, Provider } from 'aws-cdk-lib/custom-resources';
import { type Construct } from 'constructs';

import { type SetDefaultUserPasswordResourceCustomProperties } from '../../../src/lambdas/set-default-user-password/types/properties.type';
import { customOAuthScopes, ResourceServerIdentifier } from '../enums/authorization.enum';

import { type createLambdas } from './lambdas';

function createDefaultUser({
  lambdas,
  scope,
  stackId,
  userPool,
}: {
  lambdas: ReturnType<typeof createLambdas>;
  scope: Construct;
  stackId: string;
  userPool: UserPool;
}) {
  const defaultUserUsername = 'default-user';

  const defaultUsersCredentialsSecret = new Secret(scope, 'default-user-credentials', {
    generateSecretString: {
      generateStringKey: 'password',
      passwordLength: 16,
      requireEachIncludedType: true,
      secretStringTemplate: JSON.stringify({ username: defaultUserUsername }),
    },
    removalPolicy: RemovalPolicy.DESTROY,
    secretName: `${stackId}-default-user-credentials`,
  });

  const user = new CfnUserPoolUser(scope, 'default-user', {
    desiredDeliveryMediums: ['EMAIL'],
    userAttributes: [
      { name: 'email', value: 'pdfgenerator.team@gmail.com' },
      { name: 'email_verified', value: 'true' },
    ],
    username: defaultUserUsername,
    userPoolId: userPool.userPoolId,
  });

  const setDefaultUserPasswordProvider = new Provider(scope, 'set-default-user-password-provider', {
    onEventHandler: lambdas.setDefaultUserPassword,
  });

  const physicalResourceId = PhysicalResourceId.of('set-default-user-password').id;

  if (!physicalResourceId) {
    throw new Error('cognito.createDefaultUser.missingPhysicalResourceId');
  }

  const setDefaultUserPasswordCustomResource = new CustomResource(
    scope,
    'set-default-user-password-custom-resource',
    {
      properties: {
        physicalResourceId,
        userCredentialsSecretName: defaultUsersCredentialsSecret.secretName,
        userPoolId: userPool.userPoolId,
      } satisfies SetDefaultUserPasswordResourceCustomProperties,
      serviceToken: setDefaultUserPasswordProvider.serviceToken,
    },
  );

  setDefaultUserPasswordCustomResource.node.addDependency(defaultUsersCredentialsSecret);
  setDefaultUserPasswordCustomResource.node.addDependency(user);

  return { defaultUsersCredentialsSecret };
}

export function createCognito({
  lambdas,
  removalPolicy,
  scope,
  stackId,
}: {
  lambdas: ReturnType<typeof createLambdas>;
  removalPolicy: RemovalPolicy;
  scope: Construct;
  stackId: string;
}) {
  const userPool = new UserPool(scope, 'user-pool', {
    removalPolicy,
    selfSignUpEnabled: false,
    userPoolName: stackId,
  });

  const userPoolDomain = new UserPoolDomain(scope, 'user-pool-domain', {
    cognitoDomain: {
      domainPrefix: stackId,
    },
    userPool,
  });

  const userPoolScopes: ResourceServerScope[] = Object.values(customOAuthScopes).map((scope) => ({
    scopeDescription: scope.description,
    scopeName: scope.name,
  }));

  const userPoolResourceServer = new UserPoolResourceServer(scope, 'user-pool-resource-server', {
    identifier: ResourceServerIdentifier.pdfGenerator,
    scopes: userPoolScopes,
    userPool,
  });

  const userPoolClientScopes = Object.values(customOAuthScopes).map((scope) =>
    OAuthScope.custom(scope.pdfGeneratorName),
  );

  const userPoolClient = new UserPoolClient(scope, 'user-pool-client', {
    authFlows: {
      adminUserPassword: true,
      userSrp: true,
    },
    generateSecret: false,
    oAuth: {
      scopes: [OAuthScope.COGNITO_ADMIN, ...userPoolClientScopes],
    },
    preventUserExistenceErrors: true,
    userPool,
    userPoolClientName: stackId,
  });

  userPoolClient.node.addDependency(userPoolResourceServer);

  const { defaultUsersCredentialsSecret } = createDefaultUser({
    lambdas,
    scope,
    stackId,
    userPool,
  });

  return { defaultUsersCredentialsSecret, userPool, userPoolClient, userPoolDomain };
}
