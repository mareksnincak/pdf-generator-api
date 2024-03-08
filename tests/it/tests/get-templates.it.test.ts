import { randomBytes } from 'node:crypto';

import { DecryptCommand, EncryptCommand, KMSClient } from '@aws-sdk/client-kms';

import { EnvironmentName } from '../../../config/enums/config.enum';
import { setEnvVarsFromConfig } from '../../../config/helpers/config.helper';
import { Lambda } from '../../../infra/cdk/enums/lambda.enum';
import { TemplateEntityMockFactory } from '../../../src/db/template/mock-factory';
import * as templateRepository from '../../../src/db/template/repository';
import { ErrorMessage } from '../../../src/enums/error.enum';
import { mockLogger } from '../../../src/helpers/test.helper';
import { type GetTemplatesResponseDto } from '../../../src/lambdas/get-templates/dtos/response.dto';
import { getTemplates } from '../../../src/lambdas/get-templates/handler';
import { GetTemplatesRequestMockFactory } from '../../../src/lambdas/get-templates/mock-factories/request.mock-factory';
import { ApiGatewayProxyWithCognitoAuthorizerEventMockFactory } from '../../../src/mock-factories/api-gateway-proxy-with-cognito-authorizer-event.mock-factory';
import { ContextMockFactory } from '../../../src/mock-factories/context.mock-factory';
import { mockAwsCredentials } from '../helpers/credential.helper';
import { refreshDynamoDb } from '../helpers/dynamo-db.helper';

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
      userId,
      name: 'a',
    });

    await templateRepository.createOrFail(templateEntity);

    const result = await getTemplates(event, context);

    expect(result.statusCode).toEqual(200);
    expect(JSON.parse(result.body)).toEqual({
      templates: [
        {
          id: templateEntity.id,
          name: templateEntity.name,
          type: templateEntity.type,
        },
      ],
      nextPaginationToken: null,
    });
  });

  it('should return templates sorted by name', async () => {
    const queryStringParameters = requestMockFactory.create();
    const event = eventMockFactory.create({
      queryStringParameters,
    });

    const userId = event.requestContext.authorizer.claims.sub;
    const templateEntityA = templateEntityMockFactory.create({
      userId,
      name: 'a',
    });

    const templateEntityB = templateEntityMockFactory.create({
      userId,
      name: 'b',
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

    await templateRepository.createOrFail(templateEntity);

    const paginationToken = randomBytes(8).toString();
    const kmsClientSpy = jest.spyOn(KMSClient.prototype, 'send').mockImplementation(() => ({
      CiphertextBlob: Buffer.from(paginationToken),
    }));

    const result = await getTemplates(event, context);

    expect(result.statusCode).toEqual(200);

    const { nextPaginationToken } = JSON.parse(result.body) as GetTemplatesResponseDto;
    expect(Buffer.from(nextPaginationToken ?? '', 'base64url').toString()).toEqual(paginationToken);

    const kmsClientArgs = kmsClientSpy.mock.calls[0][0];
    expect(kmsClientArgs).toBeInstanceOf(EncryptCommand);
    const encryptCommandInput = (kmsClientArgs as EncryptCommand).input;
    expect(encryptCommandInput.KeyId).toEqual('sample-kms-key-id');
    expect(JSON.parse(Buffer.from(encryptCommandInput.Plaintext ?? '').toString())).toEqual({
      userId,
      token: {
        SK: '#',
        PK: `TEMPLATE#USER#${userId}#ID#${templateEntity.id}`,
        GSI1PK: `TEMPLATE#USER#${userId}`,
        GSI1SK: `NAME#${templateEntity.name}`,
      },
    });
  });

  it('should return correct page when paginationToken is provided', async () => {
    const paginationToken = randomBytes(8).toString('base64url');
    const queryStringParameters = requestMockFactory.create({
      limit: '2',
      paginationToken,
    });
    const event = eventMockFactory.create({
      queryStringParameters,
    });

    const userId = event.requestContext.authorizer.claims.sub;
    const templateEntityA = templateEntityMockFactory.create({
      userId,
      name: 'a',
    });

    const templateEntityB = templateEntityMockFactory.create({
      userId,
      name: 'b',
    });

    const templateEntityC = templateEntityMockFactory.create({
      userId,
      name: 'c',
    });

    await Promise.all([
      templateRepository.createOrFail(templateEntityA),
      templateRepository.createOrFail(templateEntityB),
      templateRepository.createOrFail(templateEntityC),
    ]);

    const kmsClientSpy = jest.spyOn(KMSClient.prototype, 'send').mockImplementation(() => ({
      Plaintext: Buffer.from(
        JSON.stringify({
          userId,
          token: {
            SK: '#',
            PK: `TEMPLATE#USER#${userId}#ID#${templateEntityB.id}`,
            GSI1PK: `TEMPLATE#USER#${userId}`,
            GSI1SK: `NAME#${templateEntityB.name}`,
          },
        }),
      ),
    }));

    const result = await getTemplates(event, context);

    expect(result.statusCode).toEqual(200);

    const { templates } = JSON.parse(result.body) as GetTemplatesResponseDto;
    expect(templates).toHaveLength(1);
    expect(templates[0].name).toEqual(templateEntityC.name);

    const kmsClientArgs = kmsClientSpy.mock.calls[0][0];
    expect(kmsClientArgs).toBeInstanceOf(DecryptCommand);
    const decryptCommandInput = (kmsClientArgs as DecryptCommand).input;
    expect(Buffer.from(decryptCommandInput.CiphertextBlob ?? '').toString('base64url')).toEqual(
      paginationToken,
    );
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
    const paginationToken = randomBytes(8).toString('base64url');
    const queryStringParameters = requestMockFactory.create({
      paginationToken,
    });

    const event = eventMockFactory.create({
      queryStringParameters,
    });

    jest.spyOn(KMSClient.prototype, 'send').mockImplementation(() => {
      throw new Error('getTemplatesIt.expectedError');
    });

    const result = await getTemplates(event, context);

    expect(result.statusCode).toEqual(400);
    expect(JSON.parse(result.body)).toEqual({
      message: ErrorMessage.invalidPaginationToken,
    });
  });
});
