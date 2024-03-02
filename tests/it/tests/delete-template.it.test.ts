import { randomUUID } from 'node:crypto';

import { DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3';

import { EnvironmentName } from '../../../config/enums/config.enum';
import { setEnvVarsFromConfig } from '../../../config/helpers/config.helper';
import { Lambda } from '../../../infra/cdk/enums/lambda.enum';
import { TemplateEntityMockFactory } from '../../../src/db/template/template.mock-factory';
import { createOrReplace, getById } from '../../../src/db/template/template.repository';
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
  jest.resetAllMocks();
});

describe('deleteTemplate', () => {
  it('should delete template', async () => {
    const s3ClientSpy = jest.spyOn(S3Client.prototype, 'send').mockImplementation();

    const templateId = randomUUID();
    const pathParameters = requestMockFactory.create({ id: templateId });
    const event = eventMockFactory.create({
      pathParameters,
    });

    const userId = event.requestContext.authorizer.claims.sub;
    const templateEntity = templateEntityMockFactory.create({
      id: templateId,
      userId,
    });

    await createOrReplace(templateEntity);

    const result = await deleteTemplate(event, context);

    expect(result.statusCode).toEqual(204);
    expect(result.body).toEqual('');

    const templateAfterDeletion = await getById({ id: templateEntity.id, userId });
    expect(templateAfterDeletion).toEqual(null);

    const s3ClientArgs = s3ClientSpy.mock.calls[0][0];
    expect(s3ClientArgs).toBeInstanceOf(DeleteObjectCommand);
    expect(s3ClientArgs.input).toEqual({
      Bucket: 'pdf-generator-api-it-test',
      Key: templateEntity.s3Key,
    });
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
