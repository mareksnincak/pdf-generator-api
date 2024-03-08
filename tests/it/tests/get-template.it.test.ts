import { randomUUID } from 'node:crypto';

import { GetObjectCommand } from '@aws-sdk/client-s3';
import * as requestPresigner from '@aws-sdk/s3-request-presigner';

import { EnvironmentName } from '../../../config/enums/config.enum';
import { setEnvVarsFromConfig } from '../../../config/helpers/config.helper';
import { Lambda } from '../../../infra/cdk/enums/lambda.enum';
import { TemplateEntityMockFactory } from '../../../src/db/template/mock-factory';
import { createOrFail } from '../../../src/db/template/repository';
import { ErrorMessage } from '../../../src/enums/error.enum';
import { mockLogger } from '../../../src/helpers/test.helper';
import { getTemplate } from '../../../src/lambdas/get-template/handler';
import { GetTemplateRequestMockFactory } from '../../../src/lambdas/get-template/mock-factories/request.mock-factory';
import { ApiGatewayProxyWithCognitoAuthorizerEventMockFactory } from '../../../src/mock-factories/api-gateway-proxy-with-cognito-authorizer-event.mock-factory';
import { ContextMockFactory } from '../../../src/mock-factories/context.mock-factory';
import { mockAwsCredentials } from '../helpers/credential.helper';
import { refreshDynamoDb } from '../helpers/dynamo-db.helper';

const requestMockFactory = new GetTemplateRequestMockFactory();
const eventMockFactory = new ApiGatewayProxyWithCognitoAuthorizerEventMockFactory();
const templateEntityMockFactory = new TemplateEntityMockFactory();
const context = new ContextMockFactory().create();

jest.mock('@aws-sdk/s3-request-presigner', () => {
  return {
    __esModule: true,
    ...jest.requireActual('@aws-sdk/s3-request-presigner'),
  };
});

beforeAll(() => {
  setEnvVarsFromConfig(EnvironmentName.localTest, Lambda.getTemplate);
  mockAwsCredentials();
});

beforeEach(async () => {
  await refreshDynamoDb();
});

afterEach(() => {
  jest.resetAllMocks();
});

describe('getTemplate', () => {
  it('should return template', async () => {
    const mockedUrl = 'http://mocked.example.com/path';
    const getSignedUrlSpy = jest
      .spyOn(requestPresigner, 'getSignedUrl')
      .mockResolvedValue(mockedUrl);

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

    await createOrFail(templateEntity);

    const result = await getTemplate(event, context);

    expect(result.statusCode).toEqual(200);
    expect(JSON.parse(result.body)).toEqual({
      dataUrl: mockedUrl,
      id,
      name: templateEntity.name,
      type: templateEntity.type,
    });

    const getSignedUrlArgs = getSignedUrlSpy.mock.calls[0];
    expect(getSignedUrlArgs[1]).toBeInstanceOf(GetObjectCommand);
    expect(getSignedUrlArgs[1].input).toEqual({
      Bucket: 'pdf-generator-api-test',
      Key: templateEntity.s3Key,
    });
  });

  it('should return 404 when template does not exist', async () => {
    mockLogger();

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
