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
          sub: '1ddad69f-d1c3-4b81-a291-67d588581ea0',
        },
      },
      ...overrides,
    } satisfies Partial<ApiGatewayEventRequestContextWithCognitoAuthorizer> as ApiGatewayEventRequestContextWithCognitoAuthorizer;
  }
}
