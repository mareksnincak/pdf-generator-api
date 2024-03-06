import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import request from 'supertest';

import { CreateTemplateRequestMockFactory } from '../../../src/lambdas/create-template/mock-factories/request.mock-factory';
import { type GetTemplatesResponseDto } from '../../../src/lambdas/get-templates/dtos/response.dto';
import { type GetUrlForTemplateUploadResponseDto } from '../../../src/lambdas/get-url-for-template-upload/dtos/response.dto';
import { documentMockName } from '../../common/constants/document.constant';
import { isSamePdfFile } from '../../common/helpers/pdf.helper';
import { getE2eSetup } from '../helpers/setup.helper';

let baseUrl: string;
let accessToken: string;

const createTemplateRequestMockFactory = new CreateTemplateRequestMockFactory();
let templateId: string | null = null;

beforeAll(async () => {
  const e2eSetup = await getE2eSetup();
  baseUrl = e2eSetup.baseUrl;
  accessToken = e2eSetup.accessToken;
});

afterAll(async () => {
  if (templateId) {
    /**
     * Try to delete task it wasn't deleted it delete test e.g. if running only create test
     */
    console.log('templateE2e.cleanup.deletingTemplate', templateId);
    await request(baseUrl).delete(`/templates/${templateId}`).expect(204);
  }
});

const mocksPath = join(__dirname, '..', '..', 'common', 'mocks');

describe('PDF Generator', () => {
  it('should create template', async () => {
    const templateData = await readFile(join(mocksPath, 'document.mock.html'));

    // Get url for template upload
    const { body: getUrlForTemplateUploadResponse } = await request(baseUrl)
      .get('/templates/upload-url')
      .query({
        fileSizeBytes: templateData.byteLength,
      })
      .auth(accessToken, { type: 'bearer' })
      .expect(200);

    expect(getUrlForTemplateUploadResponse).toHaveProperty('uploadId');
    expect(getUrlForTemplateUploadResponse).toHaveProperty('url');

    const { uploadId, url: uploadUrl } =
      getUrlForTemplateUploadResponse as GetUrlForTemplateUploadResponseDto;

    // Upload template data
    await request(uploadUrl).put('').send(templateData).expect(200);

    // Create template
    const { body: createTemplateResponse } = await request(baseUrl)
      .post('/templates')
      .send(
        createTemplateRequestMockFactory.create({
          uploadId,
        }),
      )
      .auth(accessToken, { type: 'bearer' })
      .expect(201);

    expect(createTemplateResponse).toHaveProperty('id');
    templateId = createTemplateResponse.id;
  });

  it('should return template', async () => {
    expect(templateId).toBeDefined();

    const { body } = await request(baseUrl)
      .get(`/templates/${templateId}`)
      .auth(accessToken, { type: 'bearer' })
      .expect(200);

    expect(body).toHaveProperty('id', templateId);
  });

  it('should return templates', async () => {
    const { body } = await request(baseUrl)
      .get('/templates')
      .query({
        limit: '1',
      })
      .auth(accessToken, { type: 'bearer' })
      .expect(200);

    expect(body).toHaveProperty('templates');
    expect((body as GetTemplatesResponseDto).templates).toHaveLength(1);
    expect(body).toHaveProperty('nextPaginationToken', expect.any(String));
  });

  it('should generate document', async () => {
    expect(templateId).toBeDefined();

    const { body: generateDocumentResponse } = await request(baseUrl)
      .post('/documents/generate')
      .send({
        templateId,
        data: {
          name: documentMockName,
        },
      })
      .auth(accessToken, { type: 'bearer' })
      .expect(200);

    expect(generateDocumentResponse).toHaveProperty('url', expect.any(String));

    const { body: generatedDocument } = (await request(generateDocumentResponse.url as string)
      .get('')
      .responseType('blob')
      .expect(200)) as { body: Buffer };

    const expectedDocument = await readFile(join(mocksPath, 'document.mock.pdf'));
    expect(await isSamePdfFile(generatedDocument, expectedDocument)).toEqual(true);
  });

  it('should delete template', async () => {
    expect(templateId).toBeDefined();

    await request(baseUrl)
      .delete(`/templates/${templateId}`)
      .auth(accessToken, { type: 'bearer' })
      .expect(204);

    templateId = null;
  });
});