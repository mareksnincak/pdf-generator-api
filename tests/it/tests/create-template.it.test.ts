import * as crypto from 'node:crypto';
import { randomUUID } from 'node:crypto';

import { EnvironmentName } from '../../../config/enums/config.enum';
import { setEnvVarsFromConfig } from '../../../config/helpers/config.helper';
import { Lambda } from '../../../infra/cdk/enums/lambda.enum';
import { MalwareScanStatus } from '../../../src/db/template/enum';
import { TemplateEntityMockFactory } from '../../../src/db/template/mock-factory';
import * as templateRepository from '../../../src/db/template/repository';
import { ErrorMessage } from '../../../src/enums/error.enum';
import { mockLogger } from '../../../src/helpers/test.helper';
import { type CreateTemplateResponseDto } from '../../../src/lambdas/create-template/dtos/response.dto';
import { createTemplate } from '../../../src/lambdas/create-template/handler';
import { CreateTemplateRequestMockFactory } from '../../../src/lambdas/create-template/mock-factories/request.mock-factory';
import { ApiGatewayProxyWithCognitoAuthorizerEventMockFactory } from '../../../src/mock-factories/api-gateway-proxy-with-cognito-authorizer-event.mock-factory';
import { ContextMockFactory } from '../../../src/mock-factories/context.mock-factory';
import { mockAwsCredentials } from '../helpers/credential.helper';
import { refreshDynamoDb } from '../helpers/dynamo-db.helper';
import { getS3Object, putS3Object, refreshS3Bucket, s3ObjectExists } from '../helpers/s3.helper';

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
  await Promise.all([refreshDynamoDb(), refreshS3Bucket(process.env.S3_BUCKET!)]);
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('createTemplate', () => {
  it('should create template', async () => {
    const mockedDate = new Date();
    jest.useFakeTimers().setSystemTime(mockedDate);

    const id = randomUUID();
    jest.spyOn(crypto, 'randomUUID').mockReturnValue(id);

    const requestBody = requestMockFactory.create({ name: 'sample template' });
    const event = eventMockFactory.create({ body: JSON.stringify(requestBody) });
    const userId = event.requestContext.authorizer.claims.sub;

    const uploadedObjectContent = Buffer.from('<html>{{name}}</html>');
    await putS3Object(
      process.env.S3_BUCKET!,
      `templates/uploads/${userId}/${requestBody.uploadId}`,
      uploadedObjectContent,
    );

    const result = await createTemplate(event, context);

    expect(result.statusCode).toEqual(201);

    const body = JSON.parse(result.body) as CreateTemplateResponseDto;
    expect(body).toEqual({
      id,
      malwareScanStatus: MalwareScanStatus.pending,
      name: requestBody.name,
      type: requestBody.type,
    });

    const [movedS3Object, oldUploadedS3ObjectExists] = await Promise.all([
      getS3Object(process.env.S3_BUCKET!, `templates/data/${userId}/${id}`),
      s3ObjectExists(process.env.S3_BUCKET!, `templates/uploads/${userId}/${requestBody.uploadId}`),
    ]);

    expect(movedS3Object).toEqual(uploadedObjectContent);
    expect(oldUploadedS3ObjectExists).toBe(false);

    const createdTemplate = await templateRepository.getByIdOrFail({ id, userId });
    expect(createdTemplate).toEqual({
      createdAt: new Date(mockedDate.setMilliseconds(0)),
      GSI1PK: `TEMPLATE#USER#${userId}`,
      GSI1SK: `NAME#${requestBody.name}`,
      id,
      malwareScanStatus: MalwareScanStatus.pending,
      name: requestBody.name,
      PK: `TEMPLATE#USER#${userId}#ID#${id}`,
      s3Key: `templates/data/${userId}/${requestBody.uploadId}`,
      SK: '#',
      type: 'html/handlebars',
      userId,
    });
  });

  it('should return 404 when template data does not exist', async () => {
    mockLogger();

    const requestBody = requestMockFactory.create();
    const event = eventMockFactory.create({ body: JSON.stringify(requestBody) });

    const result = await createTemplate(event, context);

    expect(result.statusCode).toEqual(404);
    expect(JSON.parse(result.body)).toEqual({ message: ErrorMessage.templateDataNotFound });
  });

  it('should return 409 and delete s3 data when template already exists', async () => {
    mockLogger();

    const id = randomUUID();
    jest.spyOn(crypto, 'randomUUID').mockReturnValue(id);

    const requestBody = requestMockFactory.create();
    const event = eventMockFactory.create({ body: JSON.stringify(requestBody) });
    const userId = event.requestContext.authorizer.claims.sub;

    await putS3Object(
      process.env.S3_BUCKET!,
      `templates/uploads/${userId}/${requestBody.uploadId}`,
      Buffer.from('<html>{{name}}</html>'),
    );

    const templateEntity = templateEntityMockFactory.create({ id, userId });
    await templateRepository.createOrFail(templateEntity);

    const result = await createTemplate(event, context);

    expect(result.statusCode).toEqual(409);
    expect(JSON.parse(result.body)).toEqual({ message: ErrorMessage.templateAlreadyExists });

    expect(await s3ObjectExists(process.env.S3_BUCKET!, `templates/data/${userId}/${id}`)).toBe(
      false,
    );
  });

  it('should not return 409 when id exists under other user', async () => {
    mockLogger();

    const id = randomUUID();
    jest.spyOn(crypto, 'randomUUID').mockReturnValue(id);

    const requestBody = requestMockFactory.create();
    const event = eventMockFactory.create({ body: JSON.stringify(requestBody) });
    const userId = event.requestContext.authorizer.claims.sub;

    await putS3Object(
      process.env.S3_BUCKET!,
      `templates/uploads/${userId}/${requestBody.uploadId}`,
      Buffer.from('<html>{{name}}</html>'),
    );

    const templateEntity = templateEntityMockFactory.create({ id, userId: 'other-user-id' });
    await templateRepository.createOrFail(templateEntity);

    const result = await createTemplate(event, context);

    expect(result.statusCode).toEqual(201);
  });
});
