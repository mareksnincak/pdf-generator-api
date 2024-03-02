import { CustomResource, RemovalPolicy } from 'aws-cdk-lib';
import {
  CfnUserPoolUser,
  OAuthScope,
  UserPool,
  UserPoolClient,
  UserPoolDomain,
  UserPoolResourceServer,
} from 'aws-cdk-lib/aws-cognito';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { PhysicalResourceId, Provider } from 'aws-cdk-lib/custom-resources';
import { type Construct } from 'constructs';

import { type SetDefaultUserPasswordResourceCustomProperties } from '../../../src/lambdas/set-default-user-password/types/properties.type';
import {
  AuthorizationScope,
  PdfGeneratorCustomAuthorizationScope,
  ResourceServerIdentifier,
} from '../enums/authorization.enum';

import { type createLambdas } from './lambdas';

function createDefaultUser({
  scope,
  stackId,
  userPool,
  lambdas,
}: {
  scope: Construct;
  stackId: string;
  userPool: UserPool;
  lambdas: ReturnType<typeof createLambdas>;
}) {
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

  const physicalResourceId = PhysicalResourceId.of('set-default-user-password').id;

  if (!physicalResourceId) {
    throw new Error('cognito.createDefaultUser.missingPhysicalResourceId');
  }

  const setDefaultUserPasswordCustomResource = new CustomResource(
    scope,
    'set-default-user-password-custom-resource',
    {
      serviceToken: setDefaultUserPasswordProvider.serviceToken,
      properties: {
        physicalResourceId,
        userCredentialsSecretName: defaultUsersCredentialsSecret.secretName,
        userPoolId: userPool.userPoolId,
      } satisfies SetDefaultUserPasswordResourceCustomProperties,
    },
  );

  setDefaultUserPasswordCustomResource.node.addDependency(defaultUsersCredentialsSecret);
  setDefaultUserPasswordCustomResource.node.addDependency(user);

  return { defaultUsersCredentialsSecret };
}

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

  new UserPoolResourceServer(scope, 'user-pool-resource-server', {
    userPool,
    identifier: ResourceServerIdentifier.pdfGenerator,
    scopes: [
      {
        scopeName: PdfGeneratorCustomAuthorizationScope.writeTemplates,
        scopeDescription: 'Modify templates',
      },
    ],
  });

  const userPoolClient = new UserPoolClient(scope, 'user-pool-client', {
    generateSecret: false,
    userPool,
    userPoolClientName: stackId,
    authFlows: {
      userSrp: true,
      adminUserPassword: true,
    },
    preventUserExistenceErrors: true,
    oAuth: {
      scopes: [
        OAuthScope.COGNITO_ADMIN,
        OAuthScope.custom(AuthorizationScope.pdfGeneratorWriteTemplates),
      ],
    },
  });

  const { defaultUsersCredentialsSecret } = createDefaultUser({
    scope,
    stackId,
    userPool,
    lambdas,
  });

  return { userPool, userPoolClient, defaultUsersCredentialsSecret };
}
