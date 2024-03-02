import { type APIGatewayEvent, type APIGatewayProxyWithCognitoAuthorizerEvent } from 'aws-lambda';
import { type LambdaEvent } from 'pino-lambda';

// TODO tests
export function getUserIdFromEvent(
  event: APIGatewayProxyWithCognitoAuthorizerEvent | APIGatewayEvent | LambdaEvent,
): string | undefined {
  return event.requestContext.authorizer?.claims?.sub;
}

export function getUserIdFromEventOrFail(
  event: APIGatewayProxyWithCognitoAuthorizerEvent | APIGatewayEvent | LambdaEvent,
) {
  const userId = getUserIdFromEvent(event);

  if (!userId) {
    throw new Error('eventHelper.getUserIdFromEventOrFail.missingUserId');
  }

  return userId;
}
