import { type APIGatewayEvent, type APIGatewayProxyWithCognitoAuthorizerEvent } from 'aws-lambda';
import { type PartialDeep } from 'type-fest';

import { LOCAL_USER_ID } from '../constants/user.constant';

import { isLocal } from './env.helper';

export function getUserIdFromEvent(
  event: PartialDeep<APIGatewayProxyWithCognitoAuthorizerEvent> | PartialDeep<APIGatewayEvent>,
): string | undefined {
  const userId = event.requestContext?.authorizer?.claims?.sub;

  if (userId) {
    return userId;
  }

  if (isLocal()) {
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
