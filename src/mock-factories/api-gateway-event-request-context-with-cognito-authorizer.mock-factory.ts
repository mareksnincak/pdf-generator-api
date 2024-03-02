import { randomUUID } from 'node:crypto';

import {
  type APIGatewayEventRequestContextWithAuthorizer,
  type APIGatewayProxyCognitoAuthorizer,
} from 'aws-lambda';

type ApiGatewayEventRequestContextWithCognitoAuthorizer =
  APIGatewayEventRequestContextWithAuthorizer<APIGatewayProxyCognitoAuthorizer>;

export class ApiGatewayEventRequestContextWithCognitoAuthorizerMockFactory {
  create(
    overrides: Partial<ApiGatewayEventRequestContextWithCognitoAuthorizer> = {},
  ): ApiGatewayEventRequestContextWithCognitoAuthorizer {
    return {
      authorizer: {
        claims: {
          sub: randomUUID(),
        },
      },
      ...overrides,
    } satisfies Partial<ApiGatewayEventRequestContextWithCognitoAuthorizer> as ApiGatewayEventRequestContextWithCognitoAuthorizer;
  }
}
