import { type APIGatewayEvent, type APIGatewayProxyWithCognitoAuthorizerEvent } from 'aws-lambda';
import { type PartialDeep } from 'type-fest';

// TODO tests
export function getUserIdFromEvent(
  event: PartialDeep<APIGatewayProxyWithCognitoAuthorizerEvent> | PartialDeep<APIGatewayEvent>,
): string | undefined {
  return event.requestContext?.authorizer?.claims?.sub;
}

export function getUserIdFromEventOrFail(event: APIGatewayProxyWithCognitoAuthorizerEvent) {
  const userId = getUserIdFromEvent(event);

  if (!userId) {
    throw new Error('eventHelper.getUserIdFromEventOrFail.missingUserId');
  }

  return userId;
}
