import * as crypto from 'node:crypto';

import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs';

import { EnvironmentName } from '../../../config/enums/config.enum';
import { setEnvVarsFromConfig } from '../../../config/helpers/config.helper';
import { Lambda } from '../../../infra/cdk/enums/lambda.enum';
import { getUrlForTemplateUpload } from '../../../src/lambdas/get-url-for-template-upload/handler';
import { GetUrlForTemplateUploadRequestMockFactory } from '../../../src/lambdas/get-url-for-template-upload/mock-factories/request.mock-factory';
import { ApiGatewayProxyWithCognitoAuthorizerEventMockFactory } from '../../../src/mock-factories/api-gateway-proxy-with-cognito-authorizer-event.mock-factory';
import { ContextMockFactory } from '../../../src/mock-factories/context.mock-factory';
import { mockAwsCredentials } from '../helpers/credential.helper';
import { refreshSqsQueue } from '../helpers/sqs.helper';

jest.mock('node:crypto', () => {
  return {
    __esModule: true,
    ...jest.requireActual<Record<string, unknown>>('node:crypto'),
  };
});

const requestMockFactory = new GetUrlForTemplateUploadRequestMockFactory();
const eventMockFactory = new ApiGatewayProxyWithCognitoAuthorizerEventMockFactory();
const context = new ContextMockFactory().create();

beforeAll(() => {
  setEnvVarsFromConfig(EnvironmentName.localTest, Lambda.getUrlForTemplateUpload);
  mockAwsCredentials();
});

beforeEach(async () => {
  await refreshSqsQueue(process.env.DELETE_EXPIRED_S3_OBJECTS_QUEUE_URL!);
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('getUrlForTemplateUpload', () => {
  it('should return data needed for template upload', async () => {
    const uploadId = crypto.randomUUID();
    jest.spyOn(crypto, 'randomUUID').mockReturnValue(uploadId);

    const queryStringParameters = requestMockFactory.create();
    const event = eventMockFactory.create({ queryStringParameters });
    const userId = event.requestContext.authorizer.claims.sub;

    // spy-without-mock: message is delayed (DelaySeconds: 120) so can't be received immediately
    const sqsSpy = jest.spyOn(SQSClient.prototype, 'send');

    const result = await getUrlForTemplateUpload(event, context);

    expect(result.statusCode).toEqual(200);

    const expectedUploadS3Key = `templates/uploads/${userId}/${uploadId}`;
    expect(JSON.parse(result.body)).toEqual({
      uploadId,
      url: expect.stringContaining(expectedUploadS3Key),
    });

    const sqsArg = sqsSpy.mock.calls[0]?.[0] as SendMessageCommand;
    expect(sqsArg).toBeInstanceOf(SendMessageCommand);
    expect(sqsArg.input.QueueUrl).toEqual(process.env.DELETE_EXPIRED_S3_OBJECTS_QUEUE_URL);
    expect(sqsArg.input.MessageBody).toEqual(expectedUploadS3Key);
  });
});
