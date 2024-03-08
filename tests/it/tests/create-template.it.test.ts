import * as crypto from 'node:crypto';
import { randomUUID } from 'node:crypto';

import { CopyObjectCommand, DeleteObjectCommand, NoSuchKey, S3Client } from '@aws-sdk/client-s3';

import { EnvironmentName } from '../../../config/enums/config.enum';
import { setEnvVarsFromConfig } from '../../../config/helpers/config.helper';
import { Lambda } from '../../../infra/cdk/enums/lambda.enum';
import { TemplateEntityMockFactory } from '../../../src/db/template/template.mock-factory';
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
const templateEntityMockFactory = new TemplateEntityMockFactory();

beforeAll(() => {
  setEnvVarsFromConfig(EnvironmentName.localTest, Lambda.createTemplate);
  mockAwsCredentials();
});

beforeEach(async () => {
  jest.useRealTimers();
  await refreshDynamoDb();
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('createTemplate', () => {
  it('should create template', async () => {
    const mockedDate = new Date();
    jest.useFakeTimers().setSystemTime(mockedDate);

    const dataId = randomUUID();
    const id = randomUUID();

    jest.spyOn(crypto, 'randomUUID').mockReturnValue(dataId);
    const s3ClientSpy = jest.spyOn(S3Client.prototype, 'send').mockImplementation();

    const requestBody = requestMockFactory.create({
      id,
      name: 'sample template',
    });
    const event = eventMockFactory.create({
      body: JSON.stringify(requestBody),
    });

    const result = await createTemplate(event, context);

    expect(result.statusCode).toEqual(201);

    const body = JSON.parse(result.body) as CreateTemplateResponseDto;
    expect(body).toEqual({
      id,
      name: requestBody.name,
      type: requestBody.type,
    });

    const userId = event.requestContext.authorizer.claims.sub;

    const s3CopyArgs = s3ClientSpy.mock.calls[0]?.[0];
    expect(s3CopyArgs).toBeInstanceOf(CopyObjectCommand);
    expect(s3CopyArgs.input).toEqual({
      Bucket: 'pdf-generator-api-test',
      CopySource: `pdf-generator-api-test/${userId}/templates/uploads/${requestBody.uploadId}`,
      Key: `${userId}/templates/data/${dataId}`,
    });

    const s3DeleteArgs = s3ClientSpy.mock.calls[1]?.[0];
    expect(s3DeleteArgs).toBeInstanceOf(DeleteObjectCommand);
    expect(s3DeleteArgs.input).toEqual({
      Bucket: 'pdf-generator-api-test',
      Key: `${userId}/templates/uploads/${requestBody.uploadId}`,
    });

    const createdTemplate = await templateRepository.getByIdOrFail({ id, userId });
    expect(createdTemplate).toEqual({
      PK: `TEMPLATE#USER#${userId}#ID#${id}`,
      SK: '#',
      GSI1PK: `TEMPLATE#USER#${userId}`,
      GSI1SK: `NAME#${requestBody.name}`,
      createdAt: new Date(mockedDate.setMilliseconds(0)),
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

  it('should return 409 and delete s3 data when template already exists', async () => {
    mockLogger();

    const id = randomUUID();
    const dataId = randomUUID();

    jest.spyOn(crypto, 'randomUUID').mockReturnValue(dataId);
    const s3ClientSpy = jest.spyOn(S3Client.prototype, 'send').mockImplementation();

    const requestBody = requestMockFactory.create({
      id,
    });
    const event = eventMockFactory.create({
      body: JSON.stringify(requestBody),
    });

    const userId = event.requestContext.authorizer.claims.sub;
    const templateEntity = templateEntityMockFactory.create({
      id,
      userId,
    });

    await templateRepository.createOrFail(templateEntity);

    const result = await createTemplate(event, context);

    expect(result.statusCode).toEqual(409);
    expect(JSON.parse(result.body)).toEqual({
      message: ErrorMessage.templateAlreadyExists,
    });

    const s3ClientLastCallArgs = s3ClientSpy.mock.lastCall?.[0];
    expect(s3ClientLastCallArgs).toBeInstanceOf(DeleteObjectCommand);
    expect(s3ClientLastCallArgs?.input).toEqual({
      Bucket: 'pdf-generator-api-test',
      Key: `${userId}/templates/data/${dataId}`,
    });
  });

  it('should not return 409 when id exists under other user', async () => {
    mockLogger();

    const id = randomUUID();
    const dataId = randomUUID();

    jest.spyOn(crypto, 'randomUUID').mockReturnValue(dataId);
    jest.spyOn(S3Client.prototype, 'send').mockImplementation();

    const requestBody = requestMockFactory.create({
      id,
    });
    const event = eventMockFactory.create({
      body: JSON.stringify(requestBody),
    });

    const templateEntity = templateEntityMockFactory.create({
      id,
      userId: 'other-user-id',
    });

    await templateRepository.createOrFail(templateEntity);

    const result = await createTemplate(event, context);

    expect(result.statusCode).toEqual(201);
  });
});
