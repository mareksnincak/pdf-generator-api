import { createTemplate } from './create-template';
import { CreateTemplateRequestMockFactory } from './mock-factories/create-template-request.mock-factory';
import { ContextMockFactory } from '../../mock-factories/context.mock-factory';
import { ApiGatewayProxyEventMockFactory } from '../../mock-factories/api-gateway-proxy-event.mock-factory';
import { NoSuchKey, S3Client } from '@aws-sdk/client-s3';
import * as templateRepository from '../../db/template/template.repository';
import { TemplateEntityMockFactory } from '../../db/template/template.mock-factory';
import { mockLogger } from '../../helpers/test.helper';

const requestMockFactory = new CreateTemplateRequestMockFactory();
const eventMockFactory = new ApiGatewayProxyEventMockFactory();
const templateEntity = new TemplateEntityMockFactory().create();
const context = new ContextMockFactory().create();

afterEach(() => {
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
