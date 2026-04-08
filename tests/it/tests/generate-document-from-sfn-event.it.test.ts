import * as crypto from 'node:crypto';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { EnvironmentName } from '../../../config/enums/config.enum';
import { setEnvVarsFromConfig } from '../../../config/helpers/config.helper';
import { Lambda } from '../../../infra/cdk/enums/lambda.enum';
import { TemplateEntityMockFactory } from '../../../src/db/template/mock-factory';
import * as templateRepository from '../../../src/db/template/repository';
import { ErrorMessage } from '../../../src/enums/error.enum';
import { mockLogger } from '../../../src/helpers/test.helper';
import { DocumentGenerationStatus } from '../../../src/lambdas/generate-document/enums/status.enum';
import { GenerateDocumentFromSfnEventInputMockFactory } from '../../../src/lambdas/generate-document/mock-factories/sfn-input.mock-factory';
import { generateDocumentFromSfnEvent } from '../../../src/lambdas/generate-document/sfn-handler';
import { ContextMockFactory } from '../../../src/mock-factories/context.mock-factory';
import { documentMockData } from '../../common/constants/document.constant';
import { isSamePdfFile } from '../../common/helpers/pdf.helper';
import { mockAwsCredentials } from '../helpers/credential.helper';
import { refreshDynamoDb } from '../helpers/dynamo-db.helper';
import { getS3Object, putS3Object, refreshS3Bucket } from '../helpers/s3.helper';

jest.mock('node:crypto', () => {
  return {
    __esModule: true,
    ...jest.requireActual<Record<string, unknown>>('node:crypto'),
  };
});

const inputMockFactory = new GenerateDocumentFromSfnEventInputMockFactory();
const templateEntityMockFactory = new TemplateEntityMockFactory();
const context = new ContextMockFactory().create();

beforeAll(() => {
  setEnvVarsFromConfig(EnvironmentName.localTest, Lambda.generateDocumentFromSfnEvent);
  mockAwsCredentials();
});

beforeEach(async () => {
  await Promise.all([refreshDynamoDb(), refreshS3Bucket(process.env.S3_BUCKET!)]);
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('generateDocumentFromSfnEvent', () => {
  it('should generate document', async () => {
    const mocksPath = path.join(__dirname, '..', '..', 'common', 'mocks');
    const htmlTemplate = await readFile(path.join(mocksPath, 'document.mock.html'));

    const input = inputMockFactory.create({ data: documentMockData });
    const templateEntity = templateEntityMockFactory.create({
      id: input.templateId,
      userId: input.userId,
    });

    await templateRepository.createOrFail(templateEntity);
    await putS3Object(process.env.S3_BUCKET!, templateEntity.s3Key, htmlTemplate);

    const documentId = randomUUID();
    jest.spyOn(crypto, 'randomUUID').mockReturnValue(documentId);

    const result = await generateDocumentFromSfnEvent(input, context);

    const expectedS3Key = `documents/${input.userId}/${documentId}.pdf`;

    expect(result).toEqual({
      ref: input.ref,
      s3Key: expectedS3Key,
      status: DocumentGenerationStatus.success,
    });

    const generatedDocument = await getS3Object(process.env.S3_BUCKET!, expectedS3Key);
    const expectedDocument = await readFile(path.join(mocksPath, 'document.mock.pdf'));
    expect(await isSamePdfFile(generatedDocument, expectedDocument)).toEqual(true);
  });

  it('should return template not found error when template does not exist', async () => {
    mockLogger();

    const input = inputMockFactory.create();

    const result = await generateDocumentFromSfnEvent(input, context);

    expect(result).toEqual({
      message: ErrorMessage.templateNotFound,
      ref: input.ref,
      status: DocumentGenerationStatus.error,
    });
  });
});
