import { NoSuchKey, S3Client } from '@aws-sdk/client-s3';
import { TemplateEntityMockFactory } from '../../../src/db/template/template.mock-factory';
import { CreateTemplateRequestMockFactory } from '../../../src/lambdas/create-template/mock-factories/create-template-request.mock-factory';
import { ApiGatewayProxyEventMockFactory } from '../../../src/mock-factories/api-gateway-proxy-event.mock-factory';
import { ContextMockFactory } from '../../../src/mock-factories/context.mock-factory';
import * as templateRepository from '../../../src/db/template/template.repository';
import { createTemplate } from '../../../src/lambdas/create-template/create-template';
import { mockLogger } from '../../../src/helpers/test.helper';

const requestMockFactory = new CreateTemplateRequestMockFactory();
const eventMockFactory = new ApiGatewayProxyEventMockFactory();
const templateEntity = new TemplateEntityMockFactory().create();
const context = new ContextMockFactory().create();

beforeEach(() => {
  jest.resetAllMocks();
});

describe('createTemplate', () => {
  it('should create template', async () => {
    jest.spyOn(S3Client.prototype, 'send').mockImplementation();
    jest.spyOn(templateRepository, 'createOrReplace').mockResolvedValue(templateEntity);

    const requestBody = requestMockFactory.create();
    const event = eventMockFactory.create({
      body: JSON.stringify(requestBody),
    });

    const result = await createTemplate(event, context);

    expect(result.statusCode).toEqual(200);
    expect(JSON.parse(result.body)).toEqual({
      templateId: templateEntity.id,
    });
  });

  it('should return 404 when template data do not exist', async () => {
    mockLogger();
    jest.spyOn(S3Client.prototype, 'send').mockImplementation(() => {
      throw new NoSuchKey({ message: 'No such key', $metadata: {} });
    });

    const requestBody = requestMockFactory.create();
    const event = eventMockFactory.create({
      body: JSON.stringify(requestBody),
    });

    const result = await createTemplate(event, context);

    expect(result.statusCode).toEqual(404);
    expect(JSON.parse(result.body)).toEqual({
      message: 'Template data not found.',
    });
  });
});
