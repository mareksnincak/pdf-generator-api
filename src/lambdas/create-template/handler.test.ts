import { NoSuchKey } from '@aws-sdk/client-s3';

import { EnvironmentName } from '../../../config/enums/config.enum';
import { setEnvVarsFromConfig } from '../../../config/helpers/config.helper';
import { Lambda } from '../../../infra/cdk/enums/lambda.enum';
import { TemplateEntityMockFactory } from '../../db/template/template.mock-factory';
import * as templateRepository from '../../db/template/template.repository';
import { ErrorMessage } from '../../enums/error.enum';
import { ConflictError } from '../../errors/conflict.error';
import * as s3Helper from '../../helpers/s3.helper';
import { mockLogger } from '../../helpers/test.helper';
import { ApiGatewayProxyWithCognitoAuthorizerEventMockFactory } from '../../mock-factories/api-gateway-proxy-with-cognito-authorizer-event.mock-factory';
import { ContextMockFactory } from '../../mock-factories/context.mock-factory';

import { createTemplate } from './handler';
import { CreateTemplateRequestMockFactory } from './mock-factories/request.mock-factory';

const requestMockFactory = new CreateTemplateRequestMockFactory();
const eventMockFactory = new ApiGatewayProxyWithCognitoAuthorizerEventMockFactory();
const templateEntity = new TemplateEntityMockFactory().create();
const context = new ContextMockFactory().create();

beforeAll(() => {
  setEnvVarsFromConfig(EnvironmentName.localTest, Lambda.createTemplate);
});

afterEach(() => {
  jest.resetAllMocks();
});

describe('createTemplate', () => {
  it('should create template', async () => {
    jest.spyOn(s3Helper, 'moveObject').mockImplementation();
    jest.spyOn(templateRepository, 'createOrReplace').mockResolvedValue(templateEntity);

    const requestBody = requestMockFactory.create();
    const event = eventMockFactory.create({
      body: JSON.stringify(requestBody),
    });

    const result = await createTemplate(event, context);

    expect(result.statusCode).toEqual(201);
    expect(JSON.parse(result.body)).toEqual({
      id: templateEntity.id,
      name: templateEntity.name,
      type: templateEntity.type,
    });
  });

  it.each([' ', '.', '/', '\\', ':'])('should return 400 when id contains "%s"', async (id) => {
    mockLogger();
    const requestBody = requestMockFactory.create({
      id,
    });

    const event = eventMockFactory.create({
      body: JSON.stringify(requestBody),
    });

    const result = await createTemplate(event, context);
    expect(result.statusCode).toEqual(400);
  });

  it('should return 404 when template data does not exist', async () => {
    mockLogger();
    jest.spyOn(s3Helper, 'moveObject').mockImplementation(() => {
      throw new NoSuchKey({ message: 'No such key', $metadata: {} });
    });

    const requestBody = requestMockFactory.create();
    const event = eventMockFactory.create({
      body: JSON.stringify(requestBody),
    });

    const result = await createTemplate(event, context);

    expect(result.statusCode).toEqual(404);
    expect(JSON.parse(result.body)).toEqual({
      message: ErrorMessage.templateDataNotFound,
    });
  });

  it('should return 409 and delete s3 data when template already exists', async () => {
    mockLogger();
    jest.spyOn(s3Helper, 'moveObject').mockImplementation();
    const deleteObjectSpy = jest.spyOn(s3Helper, 'deleteObject').mockImplementation();
    jest.spyOn(templateRepository, 'createOrReplace').mockRejectedValue(
      new ConflictError({
        message: ErrorMessage.templateAlreadyExists,
      }),
    );

    const requestBody = requestMockFactory.create();
    const event = eventMockFactory.create({
      body: JSON.stringify(requestBody),
    });

    const result = await createTemplate(event, context);

    expect(result.statusCode).toEqual(409);
    expect(JSON.parse(result.body)).toEqual({
      message: ErrorMessage.templateAlreadyExists,
    });

    expect(deleteObjectSpy).toHaveBeenCalled();
  });
});
