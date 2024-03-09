import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import isCi from 'is-ci';
import request from 'supertest';
import waitForExpect from 'wait-for-expect';

import { DocumentBatchStatus } from '../../../src/db/document-batch/enum';
import { ErrorMessage } from '../../../src/enums/error.enum';
import { type GetDocumentBatchResultResponseDto } from '../../../src/lambdas/get-document-batch-result/dtos/response.dto';
import { documentMockData } from '../../common/constants/document.constant';
import { isSamePdfFile } from '../../common/helpers/pdf.helper';
import { getE2eSetup } from '../helpers/setup.helper';

import { createTemplateE2e, deleteTemplateE2e } from './shared.e2e';

let baseUrl: string;
let accessToken: string;

let templateId: string | null = null;

beforeAll(async () => {
  const e2eSetup = await getE2eSetup();
  baseUrl = e2eSetup.baseUrl;
  accessToken = e2eSetup.accessToken;

  templateId = await createTemplateE2e({ baseUrl, accessToken });
});

afterAll(async () => {
  if (templateId) {
    await deleteTemplateE2e({ baseUrl, accessToken, templateId });
  }
});

const mocksPath = join(__dirname, '..', '..', 'common', 'mocks');

describe('Documents', () => {
  it('should generate document', async () => {
    expect(templateId).toBeDefined();

    const { body: generateDocumentResponse } = await request(baseUrl)
      .post('/documents/generate')
      .send({
        templateId,
        data: documentMockData,
      })
      .auth(accessToken, { type: 'bearer' })
      .expect(200);

    expect(generateDocumentResponse).toHaveProperty('url', expect.any(String));

    const { body: generatedDocumentData } = (await request(generateDocumentResponse.url as string)
      .get('')
      .responseType('blob')
      .expect(200)) as { body: Buffer };

    const expectedDocument = await readFile(join(mocksPath, 'document.mock.pdf'));
    expect(await isSamePdfFile(generatedDocumentData, expectedDocument)).toEqual(true);
  });

  it('should generate document batch', async () => {
    expect(templateId).toBeDefined();

    const successRef = 'successRef';
    const errorRef = 'errorRef';

    const { body: generateDocumentBatchResponse } = await request(baseUrl)
      .post('/documents/batch/generate')
      .send({
        documents: [
          {
            ref: successRef,
            templateId,
            data: documentMockData,
          },
          {
            ref: errorRef,
            templateId: 'nonExistentTemplateId',
            data: documentMockData,
          },
        ],
      })
      .auth(accessToken, { type: 'bearer' })
      .expect(202);

    expect(generateDocumentBatchResponse).toHaveProperty('id', expect.any(String));
    const batchId = generateDocumentBatchResponse.id as string;

    if (!isCi) {
      // As state machine doesn't run locally, we just check if document batch was created and exit
      const { body } = await request(baseUrl)
        .get(`/documents/batch/${batchId}`)
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body).toHaveProperty('status', DocumentBatchStatus.inProgress);
      return;
    }

    let getDocumentBatchResultResponse: GetDocumentBatchResultResponseDto | undefined;
    await waitForExpect(
      async () => {
        const { body } = await request(baseUrl)
          .get(`/documents/batch/${batchId}`)
          .auth(accessToken, { type: 'bearer' })
          .expect(200);

        expect(body).toHaveProperty('status', DocumentBatchStatus.completed);
        getDocumentBatchResultResponse = body as GetDocumentBatchResultResponseDto;
      },
      15000,
      3000,
    );

    expect(getDocumentBatchResultResponse?.errors).toHaveLength(1);
    const error = getDocumentBatchResultResponse?.errors[0];
    expect(error).toHaveProperty('ref', errorRef);
    expect(error).toHaveProperty('message', ErrorMessage.templateNotFound);

    expect(getDocumentBatchResultResponse?.generatedDocuments).toHaveLength(1);
    const generatedDocument = getDocumentBatchResultResponse?.generatedDocuments[0];
    expect(generatedDocument).toHaveProperty('ref', successRef);
    expect(generatedDocument).toHaveProperty('url', expect.any(String));

    const { body: generatedDocumentData } = (await request(generatedDocument!.url)
      .get('')
      .responseType('blob')
      .expect(200)) as { body: Buffer };

    const expectedDocument = await readFile(join(mocksPath, 'document.mock.pdf'));
    expect(await isSamePdfFile(generatedDocumentData, expectedDocument)).toEqual(true);
  }, 30000);
});
