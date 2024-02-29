import request from 'supertest';
import { getE2eBaseUrl } from '../helpers/setup.helper';
import { CreateTemplateRequestMockFactory } from '../../../src/lambdas/create-template/mock-factories/request.mock-factory';
import { type GetUrlForTemplateUploadResponseDto } from '../../../src/lambdas/get-url-for-template-upload/dtos/response.dto';

const baseUrl = getE2eBaseUrl();

const createTemplateRequestMockFactory = new CreateTemplateRequestMockFactory();

let templateId: string | null = null;

afterAll(async () => {
  if (templateId) {
    /**
     * Try to delete task it wasn't deleted it delete test e.g. if running only create test
     */
    console.log('templateE2e.cleanup.deletingTemplate', templateId);
    await request(baseUrl).delete(`/templates/${templateId}`).expect(204);
  }
});

describe('Template', () => {
  it('should create template', async () => {
    const templateData = '<html>test template</html>';

    // Get url for template upload
    const { body: getUrlForTemplateUploadResponse } = await request(baseUrl)
      .get('/templates/upload-url')
      .query({
        fileSizeBytes: String(templateData.length),
      })
      .expect(200);

    expect(getUrlForTemplateUploadResponse).toHaveProperty('uploadId');
    expect(getUrlForTemplateUploadResponse).toHaveProperty('url');

    const { uploadId, url: uploadUrl } =
      getUrlForTemplateUploadResponse as GetUrlForTemplateUploadResponseDto;

    // Upload template data
    await request(uploadUrl).put('').send(Buffer.from(templateData)).expect(200);

    // Create template
    const { body: createTemplateResponse } = await request(baseUrl)
      .post('/templates')
      .send(
        createTemplateRequestMockFactory.create({
          uploadId,
        }),
      )
      .expect(200);

    expect(createTemplateResponse).toHaveProperty('templateId');
    templateId = createTemplateResponse.templateId;
  });

  it('should delete template', async () => {
    expect(templateId).toBeDefined();
    await request(baseUrl).delete(`/templates/${templateId}`).expect(204);
    templateId = null;
  });
});
