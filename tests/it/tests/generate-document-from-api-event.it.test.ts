import * as crypto from 'node:crypto';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs';

import { EnvironmentName } from '../../../config/enums/config.enum';
import { setEnvVarsFromConfig } from '../../../config/helpers/config.helper';
import { Lambda } from '../../../infra/cdk/enums/lambda.enum';
import { MalwareScanStatus } from '../../../src/db/template/enum';
import { TemplateEntityMockFactory } from '../../../src/db/template/mock-factory';
import * as templateRepository from '../../../src/db/template/repository';
import { ErrorMessage } from '../../../src/enums/error.enum';
import { mockLogger } from '../../../src/helpers/test.helper';
import { generateDocumentFromApiEvent } from '../../../src/lambdas/generate-document/api-handler';
import { GenerateDocumentFromApiEventRequestMockFactory } from '../../../src/lambdas/generate-document/mock-factories/api-request.mock-factory';
import { ApiGatewayProxyWithCognitoAuthorizerEventMockFactory } from '../../../src/mock-factories/api-gateway-proxy-with-cognito-authorizer-event.mock-factory';
import { ContextMockFactory } from '../../../src/mock-factories/context.mock-factory';
import { documentMockData } from '../../common/constants/document.constant';
import { isSamePdfFile } from '../../common/helpers/pdf.helper';
import { mockAwsCredentials } from '../helpers/credential.helper';
import { refreshDynamoDb } from '../helpers/dynamo-db.helper';
import { getS3Object, putS3Object, refreshS3Bucket } from '../helpers/s3.helper';
import { refreshSqsQueue } from '../helpers/sqs.helper';

jest.mock('node:crypto', () => {
  return {
    __esModule: true,
    ...jest.requireActual<Record<string, unknown>>('node:crypto'),
  };
});

const requestMockFactory = new GenerateDocumentFromApiEventRequestMockFactory();
const eventMockFactory = new ApiGatewayProxyWithCognitoAuthorizerEventMockFactory();
const templateEntityMockFactory = new TemplateEntityMockFactory();
const context = new ContextMockFactory().create();

beforeAll(() => {
  setEnvVarsFromConfig(EnvironmentName.localTest, Lambda.generateDocumentFromApiEvent);
  mockAwsCredentials();
});

beforeEach(async () => {
  await Promise.all([
    refreshDynamoDb(),
    refreshS3Bucket(process.env.S3_BUCKET!),
    refreshSqsQueue(process.env.DELETE_EXPIRED_S3_OBJECTS_QUEUE_URL!),
  ]);
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('generateDocument', () => {
  it('should generate document', async () => {
    const mocksPath = path.join(__dirname, '..', '..', 'common', 'mocks');
    const htmlTemplate = await readFile(path.join(mocksPath, 'document.mock.html'));

    const templateId = randomUUID();
    const body = requestMockFactory.create({ data: documentMockData, templateId });
    const event = eventMockFactory.create({ body: JSON.stringify(body) });
    const userId = event.requestContext.authorizer.claims.sub;

    const templateEntity = templateEntityMockFactory.create({ id: templateId, userId });
    await templateRepository.createOrFail(templateEntity);

    await putS3Object(process.env.S3_BUCKET!, templateEntity.s3Key, htmlTemplate);

    const documentId = randomUUID();
    jest.spyOn(crypto, 'randomUUID').mockReturnValue(documentId);

    // spy-without-mock: message is delayed (DelaySeconds: 90) so can't be received immediately
    const sqsSpy = jest.spyOn(SQSClient.prototype, 'send');

    const result = await generateDocumentFromApiEvent(event, context);

    expect(result.statusCode).toEqual(200);

    const expectedS3Key = `documents/${userId}/${documentId}.pdf`;

    expect(JSON.parse(result.body)).toEqual({ url: expect.stringContaining(expectedS3Key) });

    const generatedDocument = await getS3Object(process.env.S3_BUCKET!, expectedS3Key);
    const expectedDocument = await readFile(path.join(mocksPath, 'document.mock.pdf'));
    expect(await isSamePdfFile(generatedDocument, expectedDocument)).toEqual(true);

    const sqsArg = sqsSpy.mock.calls[0]?.[0] as SendMessageCommand;
    expect(sqsArg).toBeInstanceOf(SendMessageCommand);
    expect(sqsArg.input.QueueUrl).toEqual(process.env.DELETE_EXPIRED_S3_OBJECTS_QUEUE_URL);
    expect(sqsArg.input.MessageBody).toEqual(expectedS3Key);
  });

  it('should return 404 when template does not exist', async () => {
    mockLogger();

    const body = requestMockFactory.create();
    const event = eventMockFactory.create({ body: JSON.stringify(body) });

    const result = await generateDocumentFromApiEvent(event, context);

    expect(result.statusCode).toEqual(404);
    expect(JSON.parse(result.body)).toEqual({ message: ErrorMessage.templateNotFound });
  });

  it('should return 422 when malwareScanStatus is infected', async () => {
    mockLogger();

    const templateId = randomUUID();
    const event = eventMockFactory.create({
      body: JSON.stringify(requestMockFactory.create({ templateId })),
    });

    const userId = event.requestContext.authorizer.claims.sub;
    const template = templateEntityMockFactory.create({
      id: templateId,
      malwareScanStatus: MalwareScanStatus.infected,
      userId,
    });

    await templateRepository.createOrFail(template);

    const result = await generateDocumentFromApiEvent(event, context);

    expect(result.statusCode).toEqual(422);
    expect(JSON.parse(result.body)).toEqual({ message: ErrorMessage.templateInfected });
  });
});
