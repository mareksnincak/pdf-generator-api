import * as crypto from 'node:crypto';
import { randomUUID } from 'node:crypto';

import { EnvironmentName } from '../../../config/enums/config.enum';
import { setEnvVarsFromConfig } from '../../../config/helpers/config.helper';
import { Lambda } from '../../../infra/cdk/enums/lambda.enum';
import { ErrorMessage } from '../../enums/error.enum';
import { NotFoundError } from '../../errors/not-found.error';
import * as s3Helper from '../../helpers/s3.helper';
import { mockLogger } from '../../helpers/test.helper';
import { ContextMockFactory } from '../../mock-factories/context.mock-factory';

import { DocumentGenerationStatus } from './enums/status.enum';
import { GenerateDocumentFromSfnEventInputMockFactory } from './mock-factories/sfn-input.mock-factory';
import * as documentGenerationService from './services/document-generation.service';
import { generateDocumentFromSfnEvent } from './sfn-handler';

jest.mock('node:crypto', () => {
  return {
    __esModule: true,
    ...jest.requireActual<Record<string, unknown>>('node:crypto'),
  };
});

const inputMockFactory = new GenerateDocumentFromSfnEventInputMockFactory();
const context = new ContextMockFactory().create();

beforeAll(() => {
  setEnvVarsFromConfig(EnvironmentName.localTest, Lambda.generateDocumentFromSfnEvent);
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('generateDocumentFromSfnEvent', () => {
  it('should generate document', async () => {
    const input = inputMockFactory.create();

    jest
      .spyOn(documentGenerationService, 'generateDocument')
      .mockResolvedValue(Buffer.from(randomUUID()));
    jest.spyOn(s3Helper, 'putObject').mockResolvedValue();

    const documentId = randomUUID();
    jest.spyOn(crypto, 'randomUUID').mockReturnValue(documentId);

    const result = await generateDocumentFromSfnEvent(input, context);

    expect(result).toEqual({
      ref: input.ref,
      s3Key: `${input.userId}/documents/${documentId}.pdf`,
      status: DocumentGenerationStatus.success,
    });
  });

  it('should return template not found error when template does not exist', async () => {
    mockLogger();

    const input = inputMockFactory.create();

    jest.spyOn(documentGenerationService, 'generateDocument').mockImplementation(() => {
      throw new NotFoundError({ message: ErrorMessage.templateNotFound });
    });

    const result = await generateDocumentFromSfnEvent(input, context);

    expect(result).toEqual({
      ref: input.ref,
      message: ErrorMessage.templateNotFound,
      status: DocumentGenerationStatus.error,
    });
  });

  it('should return generic error when unknown error happens', async () => {
    mockLogger();

    const input = inputMockFactory.create();

    jest.spyOn(documentGenerationService, 'generateDocument').mockImplementation(() => {
      throw new Error('documentGenerationSfnHandlerTest.expectedError');
    });

    const result = await generateDocumentFromSfnEvent(input, context);

    expect(result).toEqual({
      ref: input.ref,
      message: ErrorMessage.internalServerError,
      status: DocumentGenerationStatus.error,
    });
  });
});
