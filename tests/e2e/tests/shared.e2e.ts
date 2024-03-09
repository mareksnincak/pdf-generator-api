import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import request from 'supertest';

import { CreateTemplateRequestMockFactory } from '../../../src/lambdas/create-template/mock-factories/request.mock-factory';
import { type GetUrlForTemplateUploadResponseDto } from '../../../src/lambdas/get-url-for-template-upload/dtos/response.dto';

const mocksPath = join(__dirname, '..', '..', 'common', 'mocks');

const createTemplateRequestMockFactory = new CreateTemplateRequestMockFactory();

export async function createTemplateE2e({
  baseUrl,
  accessToken,
}: {
  baseUrl: string;
  accessToken: string;
}) {
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

  expect(createTemplateResponse).toHaveProperty('id', expect.any(String));
  return createTemplateResponse.id as string;
}

export async function deleteTemplateE2e({
  baseUrl,
  accessToken,
  templateId,
}: {
  baseUrl: string;
  accessToken: string;
  templateId: string;
}) {
  await request(baseUrl)
    .delete(`/templates/${templateId}`)
    .auth(accessToken, { type: 'bearer' })
    .expect(204);
}
