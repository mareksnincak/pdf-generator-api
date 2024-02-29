import { createTemplate } from './handler';
import { CreateTemplateRequestMockFactory } from './mock-factories/request.mock-factory';
import { ContextMockFactory } from '../../mock-factories/context.mock-factory';
import { ApiGatewayProxyEventMockFactory } from '../../mock-factories/api-gateway-proxy-event.mock-factory';
import { NoSuchKey } from '@aws-sdk/client-s3';
import * as templateRepository from '../../db/template/template.repository';
import { TemplateEntityMockFactory } from '../../db/template/template.mock-factory';
import { mockLogger } from '../../helpers/test.helper';
import * as s3Helper from '../../helpers/s3.helper';
import { setEnvVarsFromConfig } from '../../../config/helpers/config.helper';
import { EnvironmentName } from '../../../config/enums/config.enum';
import { Lambda } from '../../../infra/cdk/enums/lambda.enum';
import { ErrorMessage } from '../../enums/error.enum';

const requestMockFactory = new CreateTemplateRequestMockFactory();
const eventMockFactory = new ApiGatewayProxyEventMockFactory();
const templateEntity = new TemplateEntityMockFactory().create();
const context = new ContextMockFactory().create();

beforeAll(() => {
  setEnvVarsFromConfig(EnvironmentName.localTest, Lambda.createTemplate);
});

afterEach(() => {
  jest.resetAllMocks();
});

describe('createTemplate', () => {
  it('should create template', async () => {
    jest.spyOn(s3Helper, 'moveObject').mockImplementation();
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
    jest.spyOn(s3Helper, 'moveObject').mockImplementation(() => {
      throw new NoSuchKey({ message: 'No such key', $metadata: {} });
    });

    const requestBody = requestMockFactory.create();
    const event = eventMockFactory.create({
      body: JSON.stringify(requestBody),
    });

    const result = await createTemplate(event, context);

    expect(result.statusCode).toEqual(404);
    expect(JSON.parse(result.body)).toEqual({
      message: ErrorMessage.templateDataNotFound,
    });
  });
});
