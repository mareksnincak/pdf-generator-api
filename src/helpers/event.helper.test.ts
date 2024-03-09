import { type APIGatewayProxyWithCognitoAuthorizerEvent } from 'aws-lambda';

import { LOCAL_USER_ID } from '../constants/user.constant';
import { ApiGatewayProxyEventMockFactory } from '../mock-factories/api-gateway-proxy-event.mock-factory';
import { ApiGatewayProxyWithCognitoAuthorizerEventMockFactory } from '../mock-factories/api-gateway-proxy-with-cognito-authorizer-event.mock-factory';

import { getUserIdFromEvent, getUserIdFromEventOrFail } from './event.helper';

beforeEach(() => {
  process.env.IS_LOCAL = 'false';
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('getUserIdFromEvent', () => {
  it('should return userId from ApiGatewayProxyWithCognitoAuthorizerEvent', () => {
    const event = new ApiGatewayProxyWithCognitoAuthorizerEventMockFactory().create();

    const result = getUserIdFromEvent(event);

    expect(result).toEqual(event.requestContext.authorizer.claims.sub);
  });

  it('should return undefined from ApiGatewayProxyEvent', () => {
    const event = new ApiGatewayProxyEventMockFactory().create();

    const result = getUserIdFromEvent(event);

    expect(result).toEqual(undefined);
  });

  it("should return local user id when running locally and event doesn't contain userId", () => {
    process.env.IS_LOCAL = 'true';
    const event = new ApiGatewayProxyEventMockFactory().create();

    const result = getUserIdFromEvent(event);

    expect(result).toEqual(LOCAL_USER_ID);
  });

  it('should return user id from event even when running locally', () => {
    process.env.IS_LOCAL = 'true';
    const event = new ApiGatewayProxyWithCognitoAuthorizerEventMockFactory().create();

    const result = getUserIdFromEvent(event);

    expect(result).toEqual(event.requestContext.authorizer.claims.sub);
  });
});

describe('getUserIdFromEventOrFail', () => {
  it('should return userId from ApiGatewayProxyWithCognitoAuthorizerEvent', () => {
    const event = new ApiGatewayProxyWithCognitoAuthorizerEventMockFactory().create();

    const result = getUserIdFromEventOrFail(event);

    expect(result).toEqual(event.requestContext.authorizer.claims.sub);
  });

  it("should throw error when event doesn't contain userId", () => {
    const event = {} as unknown as APIGatewayProxyWithCognitoAuthorizerEvent;

    try {
      getUserIdFromEventOrFail(event);
      expect(true).toEqual(false);
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toEqual(
        'eventHelper.getUserIdFromEventOrFail.missingUserId',
      );
    }
  });

  it("should return local user id when running locally and event doesn't contain userId", () => {
    process.env.IS_LOCAL = 'true';
    const event = {} as unknown as APIGatewayProxyWithCognitoAuthorizerEvent;

    const result = getUserIdFromEventOrFail(event);

    expect(result).toEqual(LOCAL_USER_ID);
  });

  it('should return user id from event even when running locally', () => {
    process.env.IS_LOCAL = 'true';
    const event = new ApiGatewayProxyWithCognitoAuthorizerEventMockFactory().create();

    const result = getUserIdFromEventOrFail(event);

    expect(result).toEqual(event.requestContext.authorizer.claims.sub);
  });
});
