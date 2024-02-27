import { type APIGatewayProxyEvent } from 'aws-lambda';

export class ApiGatewayProxyEventMockFactory {
  create(overrides: Partial<APIGatewayProxyEvent> = {}): APIGatewayProxyEvent {
    return {
      ...overrides,
    } satisfies Partial<APIGatewayProxyEvent> as APIGatewayProxyEvent;
  }
}
