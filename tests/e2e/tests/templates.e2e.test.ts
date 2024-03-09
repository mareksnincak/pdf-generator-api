import request from 'supertest';

import { type GetTemplatesResponseDto } from '../../../src/lambdas/get-templates/dtos/response.dto';
import { getE2eSetup } from '../helpers/setup.helper';

import { createTemplateE2e, deleteTemplateE2e } from './shared.e2e';

let baseUrl: string;
let accessToken: string;

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
    await deleteTemplateE2e({ baseUrl, accessToken, templateId });
  }
});

describe('Templates', () => {
  it('should create template', async () => {
    templateId = await createTemplateE2e({ baseUrl, accessToken });
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

  it('should delete template', async () => {
    expect(templateId).toBeDefined();

    await deleteTemplateE2e({ baseUrl, accessToken, templateId: templateId! });

    templateId = null;
  });
});
