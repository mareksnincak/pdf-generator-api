import request from 'supertest';
import { getE2eBaseUrl } from '../helpers/setup.helper';
import { CreateTemplateRequestMockFactory } from '../../../src/lambdas/create-template/mock-factories/request.mock-factory';
import { type GetUrlForTemplateUploadResponseDto } from '../../../src/lambdas/get-url-for-template-upload/dtos/response.dto';

// TODO clean up resources
const baseUrl = getE2eBaseUrl();

const createTemplateRequestMockFactory = new CreateTemplateRequestMockFactory();

describe('Create template flow', () => {
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
  });
});
