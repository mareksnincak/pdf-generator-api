import { ConditionalCheckFailedException } from '@aws-sdk/client-dynamodb';

import { EnvironmentName } from '../../../config/enums/config.enum';
import { setEnvVarsFromConfig } from '../../../config/helpers/config.helper';
import { Lambda } from '../../../infra/cdk/enums/lambda.enum';
import { DocumentBatchStatus } from '../../../src/db/document-batch/enum';
import { DocumentBatchEntityMockFactory } from '../../../src/db/document-batch/mock-factory';
import * as documentBatchRepository from '../../../src/db/document-batch/repository';
import { mockLogger } from '../../../src/helpers/test.helper';
import {
  GenerateDocumentFromSfnEventErrorOutputMockFactory,
  GenerateDocumentFromSfnEventSuccessOutputMockFactory,
} from '../../../src/lambdas/generate-document/mock-factories/sfn-output.mock-factory';
import { storeDocumentBatchResult } from '../../../src/lambdas/store-document-batch-result/handler';
import { StoreDocumentBatchResultInputMockFactory } from '../../../src/lambdas/store-document-batch-result/mock-factories/input.mock-factory';
import { ContextMockFactory } from '../../../src/mock-factories/context.mock-factory';
import { mockAwsCredentials } from '../helpers/credential.helper';
import { refreshDynamoDb } from '../helpers/dynamo-db.helper';

jest.mock('node:crypto', () => {
  return {
    __esModule: true,
    ...jest.requireActual<Record<string, unknown>>('node:crypto'),
  };
});

const inputMockFactory = new StoreDocumentBatchResultInputMockFactory();
const inputSuccessResultMockFactory = new GenerateDocumentFromSfnEventSuccessOutputMockFactory();
const inputErrorResultMockFactory = new GenerateDocumentFromSfnEventErrorOutputMockFactory();
const context = new ContextMockFactory().create();
const documentBatchEntityMockFactory = new DocumentBatchEntityMockFactory();

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

describe('storeDocumentBatchResult', () => {
  it('should store result', async () => {
    const mockedDate = new Date('2024-03-09T08:44:18.000Z');
    const mockedDatePlusOneHour = new Date('2024-03-09T09:44:18.000Z');
    jest.useFakeTimers().setSystemTime(mockedDate);

    const documentBatch = documentBatchEntityMockFactory.create();
    await documentBatchRepository.create(documentBatch);

    const { id, userId } = documentBatch;

    const inputSuccessResult = inputSuccessResultMockFactory.create();
    const input = inputMockFactory.create({
      id,
      userId,
      results: [inputSuccessResult],
    });

    await storeDocumentBatchResult(input, context);

    const createdDocumentBatch = await documentBatchRepository.getByIdOrFail({
      id,
      userId,
    });

    expect(createdDocumentBatch).toEqual({
      PK: `DOCUMENT_BATCH#USER#${userId}#ID#${id}`,
      SK: '#',
      createdAt: mockedDate,
      errors: [],
      expiresAt: mockedDatePlusOneHour,
      generatedDocuments: [
        {
          ref: inputSuccessResult.ref,
          s3Key: inputSuccessResult.s3Key,
        },
      ],
      id,
      status: input.status,
      userId,
    });
  });

  it('should store result with error', async () => {
    const documentBatch = documentBatchEntityMockFactory.create();
    await documentBatchRepository.create(documentBatch);

    const { id, userId } = documentBatch;

    const inputSuccessResult = inputSuccessResultMockFactory.create();
    const inputErrorResult = inputErrorResultMockFactory.create();
    const input = inputMockFactory.create({
      id,
      userId,
      results: [inputSuccessResult, inputErrorResult],
    });

    await storeDocumentBatchResult(input, context);

    const createdDocumentBatch = await documentBatchRepository.getByIdOrFail({
      id,
      userId,
    });

    expect(createdDocumentBatch.errors).toEqual([
      {
        ref: inputErrorResult.ref,
        message: inputErrorResult.message,
      },
    ]);
    expect(createdDocumentBatch.generatedDocuments).toEqual([
      {
        ref: inputSuccessResult.ref,
        s3Key: inputSuccessResult.s3Key,
      },
    ]);
    expect(createdDocumentBatch.status).toEqual(input.status);
  });

  it('should store result without results field', async () => {
    const documentBatch = documentBatchEntityMockFactory.create();
    await documentBatchRepository.create(documentBatch);

    const { id, userId } = documentBatch;

    const input = inputMockFactory.create({
      id,
      userId,
      status: DocumentBatchStatus.failure,
      results: undefined,
    });

    await storeDocumentBatchResult(input, context);

    const createdDocumentBatch = await documentBatchRepository.getByIdOrFail({
      id,
      userId,
    });

    expect(createdDocumentBatch.errors).toEqual([]);
    expect(createdDocumentBatch.generatedDocuments).toEqual([]);
    expect(createdDocumentBatch.status).toEqual(input.status);
  });

  it('should throw error when document batch does not exist', async () => {
    mockLogger();

    const inputResult = inputSuccessResultMockFactory.create();
    const input = inputMockFactory.create({
      results: [inputResult],
    });

    try {
      await storeDocumentBatchResult(input, context);
      expect(true).toEqual(false);
    } catch (error) {
      expect(error).toBeInstanceOf(ConditionalCheckFailedException);
    }
  });
});
