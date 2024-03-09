import * as crypto from 'node:crypto';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

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
  await refreshDynamoDb();
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('generateDocumentFromSfnEvent', () => {
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

    const input = inputMockFactory.create({
      data: documentMockData,
    });

    const templateEntity = templateEntityMockFactory.create({
      id: input.templateId,
      userId: input.userId,
    });

    await templateRepository.createOrFail(templateEntity);

    const documentId = randomUUID();
    jest.spyOn(crypto, 'randomUUID').mockReturnValue(documentId);

    const result = await generateDocumentFromSfnEvent(input, context);

    const expectedUploadBucket = 'pdf-generator-api-test';
    const expectedUploadS3Key = `${input.userId}/documents/${documentId}.pdf`;

    expect(result).toEqual({
      ref: input.ref,
      s3Key: expectedUploadS3Key,
      status: DocumentGenerationStatus.success,
    });

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
  });

  it('should return template not found error when template does not exist', async () => {
    mockLogger();

    const input = inputMockFactory.create();

    const result = await generateDocumentFromSfnEvent(input, context);

    expect(result).toEqual({
      ref: input.ref,
      message: ErrorMessage.templateNotFound,
      status: DocumentGenerationStatus.error,
    });
  });
});
