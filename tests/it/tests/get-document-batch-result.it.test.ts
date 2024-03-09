import { randomUUID } from 'node:crypto';

import { GetObjectCommand } from '@aws-sdk/client-s3';
import * as requestPresigner from '@aws-sdk/s3-request-presigner';

import { EnvironmentName } from '../../../config/enums/config.enum';
import { setEnvVarsFromConfig } from '../../../config/helpers/config.helper';
import { Lambda } from '../../../infra/cdk/enums/lambda.enum';
import {
  DocumentBatchEntityMockFactory,
  DocumentBatchErrorMockFactory,
  DocumentBatchGeneratedDocumentMockFactory,
} from '../../../src/db/document-batch/mock-factory';
import * as documentBatchRepository from '../../../src/db/document-batch/repository';
import { ErrorMessage } from '../../../src/enums/error.enum';
import { mockLogger } from '../../../src/helpers/test.helper';
import { getDocumentBatchResult } from '../../../src/lambdas/get-document-batch-result/handler';
import { GetDocumentBatchResultRequestMockFactory } from '../../../src/lambdas/get-document-batch-result/mock-factories/request.mock-factory';
import { ApiGatewayProxyWithCognitoAuthorizerEventMockFactory } from '../../../src/mock-factories/api-gateway-proxy-with-cognito-authorizer-event.mock-factory';
import { ContextMockFactory } from '../../../src/mock-factories/context.mock-factory';
import { mockAwsCredentials } from '../helpers/credential.helper';
import { refreshDynamoDb } from '../helpers/dynamo-db.helper';

const requestMockFactory = new GetDocumentBatchResultRequestMockFactory();
const eventMockFactory = new ApiGatewayProxyWithCognitoAuthorizerEventMockFactory();
const documentBatchEntityMockFactory = new DocumentBatchEntityMockFactory();
const context = new ContextMockFactory().create();
const errorMockFactory = new DocumentBatchErrorMockFactory();
const generatedDocumentMockFactory = new DocumentBatchGeneratedDocumentMockFactory();

jest.mock('@aws-sdk/s3-request-presigner', () => {
  return {
    __esModule: true,
    ...jest.requireActual('@aws-sdk/s3-request-presigner'),
  };
});

beforeAll(() => {
  setEnvVarsFromConfig(EnvironmentName.localTest, Lambda.getDocumentBatchResult);
  mockAwsCredentials();
});

beforeEach(async () => {
  await refreshDynamoDb();
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('getDocumentBatchResult', () => {
  it('should return document batch result', async () => {
    const mockedUrl = 'http://mocked.example.com/path';
    const getSignedUrlSpy = jest
      .spyOn(requestPresigner, 'getSignedUrl')
      .mockResolvedValue(mockedUrl);

    const id = randomUUID();
    const pathParameters = requestMockFactory.create({ id });
    const event = eventMockFactory.create({
      pathParameters,
    });

    const userId = event.requestContext.authorizer.claims.sub;

    const error = errorMockFactory.create();
    const generatedDocument = generatedDocumentMockFactory.create();
    const documentBatchEntity = documentBatchEntityMockFactory.create({
      id,
      userId,
      errors: [error],
      generatedDocuments: [generatedDocument],
    });

    await documentBatchRepository.create(documentBatchEntity);

    const result = await getDocumentBatchResult(event, context);

    expect(result.statusCode).toEqual(200);
    expect(JSON.parse(result.body)).toEqual({
      errors: [error],
      generatedDocuments: [
        {
          ref: generatedDocument.ref,
          url: mockedUrl,
        },
      ],
      id,
      status: documentBatchEntity.status,
    });

    const getSignedUrlArgs = getSignedUrlSpy.mock.calls[0];
    expect(getSignedUrlArgs[1]).toBeInstanceOf(GetObjectCommand);
    expect(getSignedUrlArgs[1].input).toEqual({
      Bucket: 'pdf-generator-api-test',
      Key: generatedDocument.s3Key,
    });
  });

  it('should return 404 when document batch does not exist', async () => {
    mockLogger();

    const pathParameters = requestMockFactory.create();
    const event = eventMockFactory.create({
      pathParameters,
    });

    const result = await getDocumentBatchResult(event, context);

    expect(result.statusCode).toEqual(404);
    expect(JSON.parse(result.body)).toEqual({
      message: ErrorMessage.documentBatchNotFound,
    });
  });
});
