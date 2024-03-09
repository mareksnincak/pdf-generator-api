import * as crypto from 'node:crypto';
import { randomUUID } from 'node:crypto';

import { SFNClient, StartExecutionCommand } from '@aws-sdk/client-sfn';

import { EnvironmentName } from '../../../config/enums/config.enum';
import { setEnvVarsFromConfig } from '../../../config/helpers/config.helper';
import { Lambda } from '../../../infra/cdk/enums/lambda.enum';
import { DocumentBatchStatus } from '../../../src/db/document-batch/enum';
import * as documentBatchRepository from '../../../src/db/document-batch/repository';
import { type StartDocumentBatchGenerationRequestDto } from '../../../src/lambdas/start-document-batch-generation/dtos/request.dto';
import { startDocumentBatchGeneration } from '../../../src/lambdas/start-document-batch-generation/handler';
import { StartDocumentBatchGenerationRequestMockFactory } from '../../../src/lambdas/start-document-batch-generation/mock-factories/request.mock-factory';
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

const requestMockFactory = new StartDocumentBatchGenerationRequestMockFactory();
const eventMockFactory = new ApiGatewayProxyWithCognitoAuthorizerEventMockFactory();
const context = new ContextMockFactory().create();

beforeAll(() => {
  setEnvVarsFromConfig(EnvironmentName.localTest, Lambda.startDocumentBatchGeneration);
  mockAwsCredentials();
});

beforeEach(async () => {
  jest.useRealTimers();
  await refreshDynamoDb();
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('startDocumentBatchGeneration', () => {
  it('should start document batch generation', async () => {
    const mockedDate = new Date('2024-03-09T08:44:18.000Z');
    const mockedDatePlusOneHour = new Date('2024-03-09T09:44:18.000Z');
    jest.useFakeTimers().setSystemTime(mockedDate);

    const requestBody = requestMockFactory.create();
    const event = eventMockFactory.create({
      body: JSON.stringify(requestBody),
    });

    const sfnClientSpy = jest.spyOn(SFNClient.prototype, 'send').mockImplementation();

    const id = randomUUID();
    jest.spyOn(crypto, 'randomUUID').mockReturnValue(id);

    const result = await startDocumentBatchGeneration(event, context);

    expect(result.statusCode).toEqual(202);

    const body = JSON.parse(result.body) as StartDocumentBatchGenerationRequestDto;
    expect(body).toEqual({
      id,
    });

    const userId = event.requestContext.authorizer.claims.sub;

    const createdDocumentBatch = await documentBatchRepository.getByIdOrFail({ id, userId });
    expect(createdDocumentBatch).toEqual({
      PK: `DOCUMENT_BATCH#USER#${userId}#ID#${id}`,
      SK: '#',
      createdAt: mockedDate,
      errors: [],
      expiresAt: mockedDatePlusOneHour,
      generatedDocuments: [],
      id,
      status: DocumentBatchStatus.inProgress,
      userId,
    });

    const sfnClientArgs = sfnClientSpy.mock.calls[0]?.[0];
    expect(sfnClientArgs).toBeInstanceOf(StartExecutionCommand);
    expect(sfnClientArgs.input).toEqual({
      input: expect.any(String),
      name: id,
      stateMachineArn: 'sample-state-machine-arn',
    });

    expect(JSON.parse((sfnClientArgs.input as { input: string }).input)).toEqual({
      requestData: {
        documents: requestBody.documents,
      },
      userId,
    });
  });
});
