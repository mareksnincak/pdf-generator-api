import { randomUUID } from 'node:crypto';

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
    const id = randomUUID();
    const pathParameters = requestMockFactory.create({ id });
    const event = eventMockFactory.create({ pathParameters });

    const userId = event.requestContext.authorizer.claims.sub;

    const error = errorMockFactory.create();
    const generatedDocument = generatedDocumentMockFactory.create();
    const documentBatchEntity = documentBatchEntityMockFactory.create({
      errors: [error],
      generatedDocuments: [generatedDocument],
      id,
      userId,
    });

    await documentBatchRepository.create(documentBatchEntity);

    const result = await getDocumentBatchResult(event, context);

    expect(result.statusCode).toEqual(200);
    expect(JSON.parse(result.body)).toEqual({
      errors: [error],
      generatedDocuments: [
        {
          ref: generatedDocument.ref,
          url: expect.stringContaining(generatedDocument.s3Key),
        },
      ],
      id,
      status: documentBatchEntity.status,
    });
  });

  it('should return 404 when document batch does not exist', async () => {
    mockLogger();

    const pathParameters = requestMockFactory.create();
    const event = eventMockFactory.create({ pathParameters });

    const result = await getDocumentBatchResult(event, context);

    expect(result.statusCode).toEqual(404);
    expect(JSON.parse(result.body)).toEqual({ message: ErrorMessage.documentBatchNotFound });
  });
});
