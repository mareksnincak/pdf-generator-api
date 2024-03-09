import { EnvironmentName } from '../../../config/enums/config.enum';
import { setEnvVarsFromConfig } from '../../../config/helpers/config.helper';
import { Lambda } from '../../../infra/cdk/enums/lambda.enum';
import { TemplateEntityMockFactory } from '../../db/template/mock-factory';
import * as templateRepository from '../../db/template/repository';
import { ApiGatewayProxyWithCognitoAuthorizerEventMockFactory } from '../../mock-factories/api-gateway-proxy-with-cognito-authorizer-event.mock-factory';
import { ContextMockFactory } from '../../mock-factories/context.mock-factory';
import { TemplateResponseMockFactory } from '../../mock-factories/template-response.mock-factory';

import { getTemplates } from './handler';
import { GetTemplatesRequestMockFactory } from './mock-factories/request.mock-factory';

const requestMockFactory = new GetTemplatesRequestMockFactory();
const eventMockFactory = new ApiGatewayProxyWithCognitoAuthorizerEventMockFactory();
const templateEntity = new TemplateEntityMockFactory().create();
const context = new ContextMockFactory().create();
const templateResponseMockFactory = new TemplateResponseMockFactory();

beforeAll(() => {
  setEnvVarsFromConfig(EnvironmentName.localTest, Lambda.getTemplates);
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('getTemplates', () => {
  it('should return array of templates', async () => {
    const template = templateResponseMockFactory.create();
    jest
      .spyOn(templateRepository, 'getMany')
      .mockResolvedValue({ templates: [templateEntity], nextPaginationToken: undefined });
    jest.spyOn(templateEntity, 'toPublicJson').mockReturnValue(template);

    const queryStringParameters = requestMockFactory.create();
    const event = eventMockFactory.create({
      queryStringParameters,
    });

    const result = await getTemplates(event, context);

    expect(result.statusCode).toEqual(200);
    expect(JSON.parse(result.body)).toEqual({
      templates: [template],
      nextPaginationToken: null,
    });
  });
});
