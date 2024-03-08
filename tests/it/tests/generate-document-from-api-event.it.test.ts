import * as crypto from 'node:crypto';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import * as requestPresigner from '@aws-sdk/s3-request-presigner';

import { EnvironmentName } from '../../../config/enums/config.enum';
import { setEnvVarsFromConfig } from '../../../config/helpers/config.helper';
import { Lambda } from '../../../infra/cdk/enums/lambda.enum';
import { TemplateEntityMockFactory } from '../../../src/db/template/mock-factory';
import { createOrFail } from '../../../src/db/template/repository';
import { ErrorMessage } from '../../../src/enums/error.enum';
import { mockLogger } from '../../../src/helpers/test.helper';
import { generateDocumentFromApiEvent } from '../../../src/lambdas/generate-document/api-handler';
import { GenerateDocumentFromApiGwEventRequestMockFactory } from '../../../src/lambdas/generate-document/mock-factories/api-request.mock-factory';
import { ApiGatewayProxyWithCognitoAuthorizerEventMockFactory } from '../../../src/mock-factories/api-gateway-proxy-with-cognito-authorizer-event.mock-factory';
import { ContextMockFactory } from '../../../src/mock-factories/context.mock-factory';
import { documentMockName } from '../../common/constants/document.constant';
import { isSamePdfFile } from '../../common/helpers/pdf.helper';
import { mockAwsCredentials } from '../helpers/credential.helper';
import { refreshDynamoDb } from '../helpers/dynamo-db.helper';

jest.mock('@aws-sdk/s3-request-presigner', () => {
  return {
    __esModule: true,
    ...jest.requireActual('@aws-sdk/s3-request-presigner'),
  };
});

jest.mock('node:crypto', () => {
  return {
    __esModule: true,
    ...jest.requireActual<Record<string, unknown>>('node:crypto'),
  };
});

const requestMockFactory = new GenerateDocumentFromApiGwEventRequestMockFactory();
const eventMockFactory = new ApiGatewayProxyWithCognitoAuthorizerEventMockFactory();
const templateEntityMockFactory = new TemplateEntityMockFactory();
const context = new ContextMockFactory().create();

beforeAll(() => {
  setEnvVarsFromConfig(EnvironmentName.localTest, Lambda.generateDocumentFromApiEvent);
  mockAwsCredentials();
});

beforeEach(async () => {
  await refreshDynamoDb();
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('generateDocument', () => {
  it('should generate document', async () => {
    const mocksPath = join(__dirname, '..', '..', 'common', 'mocks');
    const htmlTemplate = await readFile(join(mocksPath, 'document.mock.html'));

    const s3ClientSpy = jest
      .spyOn(S3Client.prototype, 'send')
      .mockImplementationOnce(() => ({
        Body: {
          transformToByteArray: () => htmlTemplate,
        },
      }))
      .mockImplementation();
    const sqsClientSpy = jest.spyOn(SQSClient.prototype, 'send').mockImplementation();

    const templateId = randomUUID();
    const body = requestMockFactory.create({
      templateId,
      data: {
        name: documentMockName,
      },
    });

    const event = eventMockFactory.create({
      body: JSON.stringify(body),
    });

    const userId = event.requestContext.authorizer.claims.sub;
    const templateEntity = templateEntityMockFactory.create({
      id: templateId,
      userId,
    });

    const mockedUrl = 'https://mocked.example.com/path';
    const getSignedUrlSpy = jest
      .spyOn(requestPresigner, 'getSignedUrl')
      .mockResolvedValue(mockedUrl);

    await createOrFail(templateEntity);

    const uploadId = randomUUID();
    jest.spyOn(crypto, 'randomUUID').mockReturnValue(uploadId);

    const result = await generateDocumentFromApiEvent(event, context);

    expect(result.statusCode).toEqual(200);
    expect(JSON.parse(result.body)).toEqual({
      url: mockedUrl,
    });

    const expectedUploadBucket = 'pdf-generator-api-test';
    const expectedUploadS3Key = `${userId}/documents/${uploadId}.pdf`;
    const s3PutObjectArgs = s3ClientSpy.mock.calls[1]?.[0];
    expect(s3PutObjectArgs).toBeInstanceOf(PutObjectCommand);
    expect(s3PutObjectArgs.input).toEqual({
      Bucket: expectedUploadBucket,
      Key: expectedUploadS3Key,
      Body: expect.any(Buffer),
    });

    const generatedDocument = (s3PutObjectArgs as PutObjectCommand).input.Body as Buffer;
    const expectedDocument = await readFile(join(mocksPath, 'document.mock.pdf'));
    expect(await isSamePdfFile(generatedDocument, expectedDocument)).toEqual(true);

    const s3GetObjectArgs = s3ClientSpy.mock.calls[0]?.[0];
    expect(s3GetObjectArgs).toBeInstanceOf(GetObjectCommand);
    expect(s3GetObjectArgs.input).toEqual({
      Bucket: expectedUploadBucket,
      Key: templateEntity.s3Key,
    });

    const getSignedUrlArgs = getSignedUrlSpy.mock.calls[0];
    expect(getSignedUrlArgs[1]).toBeInstanceOf(GetObjectCommand);
    expect(getSignedUrlArgs[1].input).toEqual({
      Bucket: expectedUploadBucket,
      Key: expectedUploadS3Key,
    });

    const sqsClientArgs = sqsClientSpy.mock.calls[0]?.[0];
    expect(sqsClientArgs).toBeInstanceOf(SendMessageCommand);
    expect(sqsClientArgs.input).toEqual({
      MessageBody: expectedUploadS3Key,
      QueueUrl: 'https://sqs.example.com/sample-delete-expired-s3-objects-queue',
      DelaySeconds: 90,
    });
  });

  it('should return 404 when template does not exist', async () => {
    mockLogger();

    const body = requestMockFactory.create();
    const event = eventMockFactory.create({
      body: JSON.stringify(body),
    });

    const result = await generateDocumentFromApiEvent(event, context);

    expect(result.statusCode).toEqual(404);
    expect(JSON.parse(result.body)).toEqual({
      message: ErrorMessage.templateNotFound,
    });
  });
});
