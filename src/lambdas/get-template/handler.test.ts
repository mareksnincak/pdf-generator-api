import { EnvironmentName } from '../../../config/enums/config.enum';
import { setEnvVarsFromConfig } from '../../../config/helpers/config.helper';
import { Lambda } from '../../../infra/cdk/enums/lambda.enum';
import { TemplateEntityMockFactory } from '../../db/template/template.mock-factory';
import * as templateRepository from '../../db/template/template.repository';
import { ErrorMessage } from '../../enums/error.enum';
import { NotFoundError } from '../../errors/not-found.error';
import { mockLogger } from '../../helpers/test.helper';
import { ApiGatewayProxyWithCognitoAuthorizerEventMockFactory } from '../../mock-factories/api-gateway-proxy-with-cognito-authorizer-event.mock-factory';
import { ContextMockFactory } from '../../mock-factories/context.mock-factory';
import { TemplateWithDataResponseMockFactory } from '../../mock-factories/template-with-data-response.mock-factory';

import { getTemplate } from './handler';
import { GetTemplateRequestMockFactory } from './mock-factories/request.mock-factory';

const requestMockFactory = new GetTemplateRequestMockFactory();
const eventMockFactory = new ApiGatewayProxyWithCognitoAuthorizerEventMockFactory();
const templateEntity = new TemplateEntityMockFactory().create();
const context = new ContextMockFactory().create();
const responseMockFactory = new TemplateWithDataResponseMockFactory();

beforeAll(() => {
  setEnvVarsFromConfig(EnvironmentName.localTest, Lambda.getTemplate);
});

afterEach(() => {
  jest.resetAllMocks();
});

describe('getTemplate', () => {
  it('should return template', async () => {
    const templateWithData = responseMockFactory.create();
    jest.spyOn(templateRepository, 'getByIdOrFail').mockResolvedValue(templateEntity);
    jest.spyOn(templateEntity, 'toPublicJsonWithData').mockResolvedValue(templateWithData);

    const pathParameters = requestMockFactory.create();
    const event = eventMockFactory.create({
      pathParameters,
    });

    const result = await getTemplate(event, context);

    expect(result.statusCode).toEqual(200);
    expect(JSON.parse(result.body)).toEqual(templateWithData);
  });

  it('should return 404 when template does not exist', async () => {
    mockLogger();

    jest.spyOn(templateRepository, 'getByIdOrFail').mockImplementation(() => {
      throw new NotFoundError({ message: ErrorMessage.templateNotFound });
    });

    const pathParameters = requestMockFactory.create();
    const event = eventMockFactory.create({
      pathParameters,
    });

    const result = await getTemplate(event, context);

    expect(result.statusCode).toEqual(404);
    expect(JSON.parse(result.body)).toEqual({
      message: ErrorMessage.templateNotFound,
    });
  });
});
