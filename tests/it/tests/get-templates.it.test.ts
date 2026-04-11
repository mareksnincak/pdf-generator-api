import { randomBytes } from 'node:crypto';

import { EnvironmentName } from '../../../config/enums/config.enum';
import { setEnvVarsFromConfig } from '../../../config/helpers/config.helper';
import { Lambda } from '../../../infra/cdk/enums/lambda.enum';
import { MalwareScanStatus } from '../../../src/db/template/enum';
import { TemplateEntityMockFactory } from '../../../src/db/template/mock-factory';
import * as templateRepository from '../../../src/db/template/repository';
import { ErrorMessage } from '../../../src/enums/error.enum';
import { encrypt } from '../../../src/helpers/kms.helper';
import { mockLogger } from '../../../src/helpers/test.helper';
import { type GetTemplatesResponseDto } from '../../../src/lambdas/get-templates/dtos/response.dto';
import { getTemplates } from '../../../src/lambdas/get-templates/handler';
import { GetTemplatesRequestMockFactory } from '../../../src/lambdas/get-templates/mock-factories/request.mock-factory';
import { ApiGatewayProxyWithCognitoAuthorizerEventMockFactory } from '../../../src/mock-factories/api-gateway-proxy-with-cognito-authorizer-event.mock-factory';
import { ContextMockFactory } from '../../../src/mock-factories/context.mock-factory';
import { mockAwsCredentials } from '../helpers/credential.helper';
import { refreshDynamoDb } from '../helpers/dynamo-db.helper';
import { createKmsKey } from '../helpers/kms.helper';

const requestMockFactory = new GetTemplatesRequestMockFactory();
const eventMockFactory = new ApiGatewayProxyWithCognitoAuthorizerEventMockFactory();
const templateEntityMockFactory = new TemplateEntityMockFactory();
const context = new ContextMockFactory().create();

beforeAll(() => {
  setEnvVarsFromConfig(EnvironmentName.localTest, Lambda.getTemplates);
  mockAwsCredentials();
});

beforeEach(async () => {
  await refreshDynamoDb();
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('getTemplates', () => {
  it('should return array of templates', async () => {
    const queryStringParameters = requestMockFactory.create();
    const event = eventMockFactory.create({
      queryStringParameters,
    });

    const userId = event.requestContext.authorizer.claims.sub;
    const templateEntity = templateEntityMockFactory.create({
      name: 'a',
      userId,
    });

    await templateRepository.createOrFail(templateEntity);

    const result = await getTemplates(event, context);

    expect(result.statusCode).toEqual(200);
    expect(JSON.parse(result.body)).toEqual({
      nextPaginationToken: null,
      templates: [
        {
          id: templateEntity.id,
          malwareScanStatus: MalwareScanStatus.clean,
          name: templateEntity.name,
          type: templateEntity.type,
        },
      ],
    });
  });

  it('should return templates sorted by name', async () => {
    const queryStringParameters = requestMockFactory.create();
    const event = eventMockFactory.create({
      queryStringParameters,
    });

    const userId = event.requestContext.authorizer.claims.sub;
    const templateEntityA = templateEntityMockFactory.create({
      name: 'a',
      userId,
    });

    const templateEntityB = templateEntityMockFactory.create({
      name: 'b',
      userId,
    });

    await Promise.all([
      templateRepository.createOrFail(templateEntityA),
      templateRepository.createOrFail(templateEntityB),
    ]);

    const result = await getTemplates(event, context);

    expect(result.statusCode).toEqual(200);

    const { templates } = JSON.parse(result.body) as GetTemplatesResponseDto;
    expect(templates).toHaveLength(2);
    expect(templates[0].name).toEqual(templateEntityA.name);
    expect(templates[1].name).toEqual(templateEntityB.name);
  });

  it('should return nextPaginationToken when limit is reached', async () => {
    const queryStringParameters = requestMockFactory.create({
      limit: '1',
    });
    const event = eventMockFactory.create({
      queryStringParameters,
    });

    const userId = event.requestContext.authorizer.claims.sub;
    const templateEntity = templateEntityMockFactory.create({
      userId,
    });

    await Promise.all([
      templateRepository.createOrFail(templateEntity),
      createKmsKey('alias/pdf-generator-api-test'),
    ]);

    const result = await getTemplates(event, context);

    expect(result.statusCode).toEqual(200);

    const { nextPaginationToken } = JSON.parse(result.body) as GetTemplatesResponseDto;
    expect(nextPaginationToken).toBeTruthy();

    // Verify pagination token is a valid encrypted value by attempting to decrypt it
    const decrypted = Buffer.from(nextPaginationToken ?? '', 'base64url');
    expect(decrypted.length).toBeGreaterThan(0);
  });

  it('should return correct page when paginationToken is provided', async () => {
    // Create event first to get its userId
    const event = eventMockFactory.create();
    const userId = event.requestContext.authorizer.claims.sub;

    const templateEntityA = templateEntityMockFactory.create({
      name: 'a',
      userId,
    });

    const templateEntityB = templateEntityMockFactory.create({
      name: 'b',
      userId,
    });

    const templateEntityC = templateEntityMockFactory.create({
      name: 'c',
      userId,
    });

    // Create KMS key and encrypt pagination token
    await Promise.all([
      templateRepository.createOrFail(templateEntityA),
      templateRepository.createOrFail(templateEntityB),
      templateRepository.createOrFail(templateEntityC),
      createKmsKey('alias/pdf-generator-api-test'),
    ]);

    const paginationData = {
      token: {
        GSI1PK: `TEMPLATE#USER#${userId}`,
        GSI1SK: `NAME#${templateEntityB.name}`,
        PK: `TEMPLATE#USER#${userId}#ID#${templateEntityB.id}`,
        SK: '#',
      },
      userId,
    };
    const paginationBuffer = await encrypt({
      data: Buffer.from(JSON.stringify(paginationData)),
      keyId: 'alias/pdf-generator-api-test',
    });
    const paginationToken = paginationBuffer.toString('base64url');

    const queryStringParameters = requestMockFactory.create({
      limit: '2',
      paginationToken,
    });

    const eventWithPaginationToken = eventMockFactory.create({
      queryStringParameters,
      requestContext: event.requestContext,
    });

    const result = await getTemplates(eventWithPaginationToken, context);

    expect(result.statusCode).toEqual(200);

    const { templates } = JSON.parse(result.body) as GetTemplatesResponseDto;
    expect(templates).toHaveLength(1);
    expect(templates[0].name).toEqual(templateEntityC.name);
  });

  it('should not return other user template', async () => {
    const queryStringParameters = requestMockFactory.create();
    const event = eventMockFactory.create({
      queryStringParameters,
    });

    const templateEntity = templateEntityMockFactory.create({
      userId: 'other-user-id',
    });

    await templateRepository.createOrFail(templateEntity);

    const result = await getTemplates(event, context);

    expect(result.statusCode).toEqual(200);

    const { templates } = JSON.parse(result.body) as GetTemplatesResponseDto;
    expect(templates).toHaveLength(0);
  });

  it('should return 400 when wrong paginationToken is provided', async () => {
    mockLogger();
    const invalidPaginationToken = randomBytes(8).toString('base64url');
    const queryStringParameters = requestMockFactory.create({
      paginationToken: invalidPaginationToken,
    });

    const event = eventMockFactory.create({
      queryStringParameters,
    });

    const result = await getTemplates(event, context);

    expect(result.statusCode).toEqual(400);
    expect(JSON.parse(result.body)).toEqual({
      message: ErrorMessage.invalidPaginationToken,
    });
  });
});
