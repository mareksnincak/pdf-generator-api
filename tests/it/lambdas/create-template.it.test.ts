import { S3Client } from '@aws-sdk/client-s3';
import { CreateTemplateRequestMockFactory } from '../../../src/lambdas/create-template/mock-factories/request.mock-factory';
import { ApiGatewayProxyEventMockFactory } from '../../../src/mock-factories/api-gateway-proxy-event.mock-factory';
import { ContextMockFactory } from '../../../src/mock-factories/context.mock-factory';
import { createTemplate } from '../../../src/lambdas/create-template/handler';
import { setEnvVarsFromConfig } from '../../../config/helpers/config.helper';
import { EnvironmentName } from '../../../config/enums/config.enum';
import { Lambda } from '../../../infra/cdk/enums/lambda.enum';
import { refreshDynamoDb } from '../helpers/dynamo-db.helper';
import { type CreateTemplateResponseDto } from '../../../src/lambdas/create-template/dtos/response.dto';
import * as templateRepository from '../../../src/db/template/template.repository';

const requestMockFactory = new CreateTemplateRequestMockFactory();
const eventMockFactory = new ApiGatewayProxyEventMockFactory();
const context = new ContextMockFactory().create();

beforeAll(async () => {
  setEnvVarsFromConfig(EnvironmentName.itTest, Lambda.createTemplate);
  await refreshDynamoDb();
});

afterEach(() => {
  jest.resetAllMocks();
});

describe('createTemplate', () => {
  it('should create template', async () => {
    const s3ClientSpy = jest.spyOn(S3Client.prototype, 'send').mockImplementation();

    const requestBody = requestMockFactory.create({
      name: 'sample template',
    });
    const event = eventMockFactory.create({
      body: JSON.stringify(requestBody),
    });

    const result = await createTemplate(event, context);

    expect(result.statusCode).toEqual(200);

    const body = JSON.parse(result.body) as CreateTemplateResponseDto;
    expect(body).toEqual({
      templateId: expect.any(String),
    });

    expect(s3ClientSpy.mock.lastCall?.[0].input).toEqual({
      Bucket: 'pdf-generator-api-it-test',
      Key: `templates/uploads/${requestBody.uploadId}`,
    });

    const { templateId } = body;
    const createdTemplate = await templateRepository.findOneById(templateId);
    expect(createdTemplate).toEqual({
      PK: `TEMPLATE#${templateId}`,
      SK: '#',
      id: templateId,
      name: requestBody.name,
      s3Key: `/templates/data/${requestBody.uploadId}`,
      type: 'html/handlebars',
    });
  });
});
