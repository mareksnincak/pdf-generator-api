import { randomUUID } from 'node:crypto';

import { EnvironmentName } from '../../../config/enums/config.enum';
import { setEnvVarsFromConfig } from '../../../config/helpers/config.helper';
import { Lambda } from '../../../infra/cdk/enums/lambda.enum';
import { ErrorMessage } from '../../enums/error.enum';
import { NotFoundError } from '../../errors/not-found.error';
import * as s3Helper from '../../helpers/s3.helper';
import * as sqsHelper from '../../helpers/sqs.helper';
import { mockLogger } from '../../helpers/test.helper';
import { ApiGatewayProxyWithCognitoAuthorizerEventMockFactory } from '../../mock-factories/api-gateway-proxy-with-cognito-authorizer-event.mock-factory';
import { ContextMockFactory } from '../../mock-factories/context.mock-factory';

import { generateDocumentFromApiEvent } from './api-handler';
import { GenerateDocumentFromApiGwEventRequestMockFactory } from './mock-factories/api-request.mock-factory';
import * as documentGenerationService from './services/document-generation.service';

const requestMockFactory = new GenerateDocumentFromApiGwEventRequestMockFactory();
const eventMockFactory = new ApiGatewayProxyWithCognitoAuthorizerEventMockFactory();
const context = new ContextMockFactory().create();

beforeAll(() => {
  setEnvVarsFromConfig(EnvironmentName.localTest, Lambda.generateDocumentFromApiEvent);
});

afterEach(() => {
  jest.resetAllMocks();
});

describe('generateDocumentFromApiEvent', () => {
  it('should generate document', async () => {
    const name = randomUUID();
    const body = requestMockFactory.create({
      data: {
        name,
      },
    });
    const event = eventMockFactory.create({
      body: JSON.stringify(body),
    });

    const mockedUrl = 'https://mocked.example.com/path';

    jest
      .spyOn(documentGenerationService, 'generateDocument')
      .mockResolvedValue(Buffer.from(randomUUID()));
    jest.spyOn(s3Helper, 'getPresignedShareUrl').mockResolvedValue(mockedUrl);
    jest.spyOn(s3Helper, 'putObject').mockResolvedValue();
    jest.spyOn(sqsHelper, 'sendSqsMessage').mockResolvedValue();

    const result = await generateDocumentFromApiEvent(event, context);

    expect(result.statusCode).toEqual(200);
    expect(JSON.parse(result.body)).toEqual({
      url: mockedUrl,
    });
  });

  it('should return 404 when template does not exist', async () => {
    mockLogger();

    jest.spyOn(documentGenerationService, 'generateDocument').mockImplementation(() => {
      throw new NotFoundError({ message: ErrorMessage.templateNotFound });
    });

    const body = requestMockFactory.create();
    const event = eventMockFactory.create({
      body: JSON.stringify(body),
    });

    const result = await generateDocumentFromApiEvent(event, context);

    expect(result.statusCode).toEqual(404);
    expect(JSON.parse(result.body)).toEqual({
      message: ErrorMessage.templateNotFound,
    });
  });
});
