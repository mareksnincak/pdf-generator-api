import { randomBytes, randomUUID } from 'node:crypto';

import { EncryptCommand, KMSClient } from '@aws-sdk/client-kms';

import { EnvironmentName } from '../../../config/enums/config.enum';
import { setEnvVarsFromConfig } from '../../../config/helpers/config.helper';
import { Lambda } from '../../../infra/cdk/enums/lambda.enum';
import { TemplateEntityMockFactory } from '../../../src/db/template/template.mock-factory';
import { createOrReplace } from '../../../src/db/template/template.repository';
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
  jest.resetAllMocks();
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

    await createOrReplace(templateEntity);

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

    await Promise.all([createOrReplace(templateEntityA), createOrReplace(templateEntityB)]);

    const result = await getTemplates(event, context);

    expect(result.statusCode).toEqual(200);

    const { templates } = JSON.parse(result.body) as GetTemplatesResponseDto;
    expect(templates).toHaveLength(2);
    expect(templates[0].name).toEqual(templateEntityA.name);
    expect(templates[1].name).toEqual(templateEntityB.name);
  });

  it('should return nextPaginationToken when limit is reached', async () => {
    const id = randomUUID();

    const queryStringParameters = requestMockFactory.create({
      limit: '1',
    });
    const event = eventMockFactory.create({
      queryStringParameters,
    });

    const userId = event.requestContext.authorizer.claims.sub;
    const templateEntity = templateEntityMockFactory.create({
      id,
      userId,
    });

    await createOrReplace(templateEntity);

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

  // it('should return correct page when paginationToken is provided', async () => {});

  // it('should not return other user template', async () => {});

  // it('should return 400 when wrong paginationToken is provided', async () => {});
});
