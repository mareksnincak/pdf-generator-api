import { setEnvVarsFromConfig } from '../../../config/helpers/config.helper';
import { EnvironmentName } from '../../../config/enums/config.enum';
import { Lambda } from '../../../infra/cdk/enums/lambda.enum';
import { DeleteTemplateRequestMockFactory } from '../../../src/lambdas/delete-template/mock-factories/request.mock-factory';
import { ApiGatewayProxyEventMockFactory } from '../../../src/mock-factories/api-gateway-proxy-event.mock-factory';
import { TemplateEntityMockFactory } from '../../../src/db/template/template.mock-factory';
import { ContextMockFactory } from '../../../src/mock-factories/context.mock-factory';
import { createOrReplace, findById } from '../../../src/db/template/template.repository';
import { DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { deleteTemplate } from '../../../src/lambdas/delete-template/handler';
import { refreshDynamoDb } from '../helpers/dynamo-db.helper';
import { mockLogger } from '../../../src/helpers/test.helper';
import { ErrorMessage } from '../../../src/enums/error.enum';

const requestMockFactory = new DeleteTemplateRequestMockFactory();
const eventMockFactory = new ApiGatewayProxyEventMockFactory();
const templateEntity = new TemplateEntityMockFactory().create();
const context = new ContextMockFactory().create();

beforeAll(() => {
  setEnvVarsFromConfig(EnvironmentName.localTest, Lambda.deleteTemplate);
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

    await createOrReplace(templateEntity);

    const pathParameters = requestMockFactory.create({ id: templateEntity.id });
    const event = eventMockFactory.create({
      pathParameters,
    });

    const result = await deleteTemplate(event, context);

    expect(result.statusCode).toEqual(204);
    expect(result.body).toEqual('');

    const templateAfterDeletion = await findById(templateEntity.id);
    expect(templateAfterDeletion).toEqual(null);

    const s3DeleteSpy = s3ClientSpy.mock.calls[0][0];
    expect(s3DeleteSpy).toBeInstanceOf(DeleteObjectCommand);
    expect(s3DeleteSpy.input).toEqual({
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
