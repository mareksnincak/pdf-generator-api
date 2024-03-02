import * as crypto from 'node:crypto';
import { randomUUID } from 'node:crypto';

import { CopyObjectCommand, DeleteObjectCommand, NoSuchKey, S3Client } from '@aws-sdk/client-s3';

import { EnvironmentName } from '../../../config/enums/config.enum';
import { setEnvVarsFromConfig } from '../../../config/helpers/config.helper';
import { Lambda } from '../../../infra/cdk/enums/lambda.enum';
import * as templateRepository from '../../../src/db/template/template.repository';
import { ErrorMessage } from '../../../src/enums/error.enum';
import { mockLogger } from '../../../src/helpers/test.helper';
import { type CreateTemplateResponseDto } from '../../../src/lambdas/create-template/dtos/response.dto';
import { createTemplate } from '../../../src/lambdas/create-template/handler';
import { CreateTemplateRequestMockFactory } from '../../../src/lambdas/create-template/mock-factories/request.mock-factory';
import { ApiGatewayProxyWithCognitoAuthorizerEventMockFactory } from '../../../src/mock-factories/api-gateway-proxy-with-cognito-authorizer-event.mock-factory';
import { ContextMockFactory } from '../../../src/mock-factories/context.mock-factory';
import { mockAwsCredentials } from '../helpers/credential.helper';
import { refreshDynamoDb } from '../helpers/dynamo-db.helper';

jest.mock('node:crypto', () => {
  return {
    __esModule: true,
    ...jest.requireActual<Record<string, unknown>>('node:crypto'),
  };
});

const requestMockFactory = new CreateTemplateRequestMockFactory();
const eventMockFactory = new ApiGatewayProxyWithCognitoAuthorizerEventMockFactory();
const context = new ContextMockFactory().create();

beforeAll(() => {
  setEnvVarsFromConfig(EnvironmentName.localTest, Lambda.createTemplate);
  mockAwsCredentials();
});

beforeEach(async () => {
  await refreshDynamoDb();
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('createTemplate', () => {
  it('should create template', async () => {
    const dataId = randomUUID();

    jest.spyOn(crypto, 'randomUUID').mockReturnValue(dataId);
    const s3ClientSpy = jest.spyOn(S3Client.prototype, 'send').mockImplementation();

    const requestBody = requestMockFactory.create({
      name: 'sample template',
    });
    const event = eventMockFactory.create({
      body: JSON.stringify(requestBody),
    });

    const result = await createTemplate(event, context);

    expect(result.statusCode).toEqual(200);

    const body = JSON.parse(result.body) as CreateTemplateResponseDto;
    expect(body).toEqual({
      id: expect.any(String),
    });

    const userId = event.requestContext.authorizer.claims.sub;

    const s3CopyArgs = s3ClientSpy.mock.calls[0]?.[0];
    expect(s3CopyArgs).toBeInstanceOf(CopyObjectCommand);
    expect(s3CopyArgs.input).toEqual({
      Bucket: 'pdf-generator-api-it-test',
      CopySource: `pdf-generator-api-it-test/${userId}/templates/uploads/${requestBody.uploadId}`,
      Key: `${userId}/templates/data/${dataId}`,
    });

    const s3DeleteArgs = s3ClientSpy.mock.calls[1]?.[0];
    expect(s3DeleteArgs).toBeInstanceOf(DeleteObjectCommand);
    expect(s3DeleteArgs.input).toEqual({
      Bucket: 'pdf-generator-api-it-test',
      Key: `${userId}/templates/uploads/${requestBody.uploadId}`,
    });

    const { id } = body;
    const createdTemplate = await templateRepository.getById({ id, userId });
    expect(createdTemplate).toEqual({
      PK: `TEMPLATE#${userId}#${id}`,
      SK: '#',
      id,
      name: requestBody.name,
      s3Key: `${userId}/templates/data/${requestBody.uploadId}`,
      type: 'html/handlebars',
      userId,
    });
  });

  it('should return 404 when template data does not exist', async () => {
    mockLogger();
    jest.spyOn(S3Client.prototype, 'send').mockImplementation(() => {
      throw new NoSuchKey({ message: 'No such key', $metadata: {} });
    });

    const requestBody = requestMockFactory.create();
    const event = eventMockFactory.create({
      body: JSON.stringify(requestBody),
    });

    const result = await createTemplate(event, context);

    expect(result.statusCode).toEqual(404);
    expect(JSON.parse(result.body)).toEqual({
      message: ErrorMessage.templateDataNotFound,
    });
  });
});
