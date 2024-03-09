import { randomUUID } from 'node:crypto';

import { EnvironmentName } from '../../../config/enums/config.enum';
import { setEnvVarsFromConfig } from '../../../config/helpers/config.helper';
import { Lambda } from '../../../infra/cdk/enums/lambda.enum';
import { TemplateEntityMockFactory } from '../../../src/db/template/mock-factory';
import * as templateRepository from '../../../src/db/template/repository';
import { ErrorMessage } from '../../../src/enums/error.enum';
import { mockLogger } from '../../../src/helpers/test.helper';
import { deleteTemplate } from '../../../src/lambdas/delete-template/handler';
import { DeleteTemplateRequestMockFactory } from '../../../src/lambdas/delete-template/mock-factories/request.mock-factory';
import { ApiGatewayProxyWithCognitoAuthorizerEventMockFactory } from '../../../src/mock-factories/api-gateway-proxy-with-cognito-authorizer-event.mock-factory';
import { ContextMockFactory } from '../../../src/mock-factories/context.mock-factory';
import { mockAwsCredentials } from '../helpers/credential.helper';
import { refreshDynamoDb } from '../helpers/dynamo-db.helper';

const requestMockFactory = new DeleteTemplateRequestMockFactory();
const eventMockFactory = new ApiGatewayProxyWithCognitoAuthorizerEventMockFactory();
const templateEntityMockFactory = new TemplateEntityMockFactory();
const context = new ContextMockFactory().create();

beforeAll(() => {
  setEnvVarsFromConfig(EnvironmentName.localTest, Lambda.deleteTemplate);
  mockAwsCredentials();
});

beforeEach(async () => {
  await refreshDynamoDb();
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('deleteTemplate', () => {
  it('should delete template', async () => {
    const id = randomUUID();
    const pathParameters = requestMockFactory.create({ id });
    const event = eventMockFactory.create({
      pathParameters,
    });

    const userId = event.requestContext.authorizer.claims.sub;
    const templateEntity = templateEntityMockFactory.create({
      id,
      userId,
    });

    await templateRepository.createOrFail(templateEntity);

    const result = await deleteTemplate(event, context);

    expect(result.statusCode).toEqual(204);
    expect(result.body).toEqual('');

    const templateAfterDeletion = await templateRepository.getById({
      id: templateEntity.id,
      userId,
    });
    expect(templateAfterDeletion).toEqual(null);
  });

  it('should return 404 when template does not exist', async () => {
    mockLogger();

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
