import { EnvironmentName } from '../../../config/enums/config.enum';
import { setEnvVarsFromConfig } from '../../../config/helpers/config.helper';
import { Lambda } from '../../../infra/cdk/enums/lambda.enum';
import { DocumentBatchStatus } from '../../db/document-batch/enum';
import * as documentBatchRepository from '../../db/document-batch/repository';
import { mockLogger } from '../../helpers/test.helper';
import { ContextMockFactory } from '../../mock-factories/context.mock-factory';
import {
  GenerateDocumentFromSfnEventErrorOutputMockFactory,
  GenerateDocumentFromSfnEventSuccessOutputMockFactory,
} from '../generate-document/mock-factories/sfn-output.mock-factory';

import { storeDocumentBatchResult } from './handler';
import { StoreDocumentBatchResultInputMockFactory } from './mock-factories/input.mock-factory';

const inputMockFactory = new StoreDocumentBatchResultInputMockFactory();
const inputSuccessResultMockFactory = new GenerateDocumentFromSfnEventSuccessOutputMockFactory();
const inputErrorResultMockFactory = new GenerateDocumentFromSfnEventErrorOutputMockFactory();
const context = new ContextMockFactory().create();

beforeAll(() => {
  setEnvVarsFromConfig(EnvironmentName.localTest, Lambda.getDocumentBatchResult);
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('storeDocumentBatchResult', () => {
  it('should store result', async () => {
    const updateByIdSpy = jest.spyOn(documentBatchRepository, 'updateById').mockResolvedValue();

    const result = inputSuccessResultMockFactory.create();
    const input = inputMockFactory.create({
      results: [result],
    });

    await storeDocumentBatchResult(input, context);

    expect(updateByIdSpy).toHaveBeenCalledWith(
      {
        id: input.id,
        userId: input.userId,
      },
      {
        errors: [],
        generatedDocuments: [
          {
            ref: result.ref,
            s3Key: result.s3Key,
          },
        ],
        status: input.status,
      },
    );
  });

  it('should store result with error', async () => {
    const updateByIdSpy = jest.spyOn(documentBatchRepository, 'updateById').mockResolvedValue();

    const successResult = inputSuccessResultMockFactory.create();
    const errorResult = inputErrorResultMockFactory.create();
    const input = inputMockFactory.create({
      results: [successResult, errorResult],
    });

    await storeDocumentBatchResult(input, context);

    expect(updateByIdSpy).toHaveBeenCalledWith(
      {
        id: input.id,
        userId: input.userId,
      },
      {
        errors: [
          {
            ref: errorResult.ref,
            message: errorResult.message,
          },
        ],
        generatedDocuments: [
          {
            ref: successResult.ref,
            s3Key: successResult.s3Key,
          },
        ],
        status: input.status,
      },
    );
  });

  it('should store result without results field', async () => {
    mockLogger();

    const updateByIdSpy = jest.spyOn(documentBatchRepository, 'updateById').mockResolvedValue();

    const input = inputMockFactory.create({
      status: DocumentBatchStatus.failure,
      results: undefined,
    });

    await storeDocumentBatchResult(input, context);

    expect(updateByIdSpy).toHaveBeenCalledWith(
      {
        id: input.id,
        userId: input.userId,
      },
      {
        errors: [],
        generatedDocuments: [],
        status: input.status,
      },
    );
  });
});
