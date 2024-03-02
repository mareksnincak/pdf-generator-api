import { type APIGatewayProxyWithCognitoAuthorizerEvent } from 'aws-lambda';

import { ApiGatewayEventRequestContextWithCognitoAuthorizerMockFactory } from './api-gateway-event-request-context-with-cognito-authorizer.mock-factory';

export class ApiGatewayProxyWithCognitoAuthorizerEventMockFactory {
  create(
    overrides: Partial<APIGatewayProxyWithCognitoAuthorizerEvent> = {},
  ): APIGatewayProxyWithCognitoAuthorizerEvent {
    return {
      requestContext: new ApiGatewayEventRequestContextWithCognitoAuthorizerMockFactory().create(
        overrides.requestContext,
      ),
      ...overrides,
    } satisfies Partial<APIGatewayProxyWithCognitoAuthorizerEvent> as APIGatewayProxyWithCognitoAuthorizerEvent;
  }
}
