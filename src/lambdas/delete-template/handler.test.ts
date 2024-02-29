import { deleteTemplate } from './handler';
import { DeleteTemplateRequestMockFactory } from './mock-factories/request.mock-factory';
import { ContextMockFactory } from '../../mock-factories/context.mock-factory';
import { ApiGatewayProxyEventMockFactory } from '../../mock-factories/api-gateway-proxy-event.mock-factory';
import * as templateRepository from '../../db/template/template.repository';
import { TemplateEntityMockFactory } from '../../db/template/template.mock-factory';
import { mockLogger } from '../../helpers/test.helper';
import * as s3Helper from '../../helpers/s3.helper';
import { setEnvVarsFromConfig } from '../../../config/helpers/config.helper';
import { EnvironmentName } from '../../../config/enums/config.enum';
import { Lambda } from '../../../infra/cdk/enums/lambda.enum';
import { NotFoundError } from '../../errors/not-found.error';
import { ErrorMessage } from '../../enums/error.enum';

const requestMockFactory = new DeleteTemplateRequestMockFactory();
const eventMockFactory = new ApiGatewayProxyEventMockFactory();
const templateEntity = new TemplateEntityMockFactory().create();
const context = new ContextMockFactory().create();

beforeAll(() => {
  setEnvVarsFromConfig(EnvironmentName.localTest, Lambda.deleteTemplate);
});

afterEach(() => {
  jest.resetAllMocks();
});

describe('deleteTemplate', () => {
  it('should delete template', async () => {
    jest.spyOn(s3Helper, 'deleteObject').mockImplementation();
    jest.spyOn(templateRepository, 'deleteById').mockResolvedValue(templateEntity);

    const pathParameters = requestMockFactory.create();
    const event = eventMockFactory.create({
      pathParameters,
    });

    const result = await deleteTemplate(event, context);

    expect(result.statusCode).toEqual(204);
    expect(result.body).toEqual('');
  });

  it('should return 404 when template does not exist', async () => {
    mockLogger();

    jest.spyOn(templateRepository, 'deleteById').mockImplementation(() => {
      throw new NotFoundError({ message: ErrorMessage.templateNotFound });
    });

    const pathParameters = requestMockFactory.create();
    const event = eventMockFactory.create({
      pathParameters,
    });

    const result = await deleteTemplate(event, context);

    expect(result.statusCode).toEqual(404);
    expect(JSON.parse(result.body)).toEqual({
      message: ErrorMessage.templateNotFound,
    });
  });
});
