import { type APIGatewayEvent, type APIGatewayProxyWithCognitoAuthorizerEvent } from 'aws-lambda';
import { type PartialDeep } from 'type-fest';

import { LOCAL_USER_ID } from '../constants/user.constant';

export function getUserIdFromEvent(
  event: PartialDeep<APIGatewayProxyWithCognitoAuthorizerEvent> | PartialDeep<APIGatewayEvent>,
): string | undefined {
  const userId = event.requestContext?.authorizer?.claims?.sub;

  if (userId) {
    return userId;
  }

  if (process.env.IS_LOCAL === 'true') {
    /**
     * We are returning static user id for local development
     * so we are able to use API in local context without authorizer
     */
    return LOCAL_USER_ID;
  }
}

export function getUserIdFromEventOrFail(event: APIGatewayProxyWithCognitoAuthorizerEvent) {
  const userId = getUserIdFromEvent(event);

  if (!userId) {
    throw new Error('eventHelper.getUserIdFromEventOrFail.missingUserId');
  }

  return userId;
}
