import { randomUUID } from 'node:crypto';

import { EnvironmentName } from '../../../config/enums/config.enum';
import { setEnvVarsFromConfig } from '../../../config/helpers/config.helper';
import { Lambda } from '../../../infra/cdk/enums/lambda.enum';
import { TemplateEntityMockFactory } from '../../db/template/template.mock-factory';
import * as templateRepository from '../../db/template/template.repository';
import { ErrorMessage } from '../../enums/error.enum';
import { NotFoundError } from '../../errors/not-found.error';
import * as s3Helper from '../../helpers/s3.helper';
import * as sqsHelper from '../../helpers/sqs.helper';
import { mockLogger } from '../../helpers/test.helper';
import { ApiGatewayProxyWithCognitoAuthorizerEventMockFactory } from '../../mock-factories/api-gateway-proxy-with-cognito-authorizer-event.mock-factory';
import { ContextMockFactory } from '../../mock-factories/context.mock-factory';

import { generateDocument } from './handler-api-gw';
import { GenerateDocumentMockFactory } from './mock-factories/request.mock-factory';
import * as pdfService from './services/pdf.service';

const requestMockFactory = new GenerateDocumentMockFactory();
const eventMockFactory = new ApiGatewayProxyWithCognitoAuthorizerEventMockFactory();
const templateEntity = new TemplateEntityMockFactory().create();
const context = new ContextMockFactory().create();

beforeAll(() => {
  setEnvVarsFromConfig(EnvironmentName.localTest, Lambda.generateDocumentApiGw);
});

afterEach(() => {
  jest.resetAllMocks();
});

describe('generateDocument', () => {
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
    jest.spyOn(templateRepository, 'getByIdOrFail').mockResolvedValue(templateEntity);
    jest.spyOn(templateEntity, 'getData').mockResolvedValue(Buffer.from('hello {{name}}'));
    jest.spyOn(s3Helper, 'getPresignedShareUrl').mockResolvedValue(mockedUrl);
    jest.spyOn(s3Helper, 'putObject').mockResolvedValue();
    jest.spyOn(sqsHelper, 'sendSqsMessage').mockResolvedValue();
    jest.spyOn(pdfService, 'createPdfFromHtml').mockResolvedValue(Buffer.from(randomUUID()));

    const result = await generateDocument(event, context);

    expect(result.statusCode).toEqual(200);
    expect(JSON.parse(result.body)).toEqual({
      url: mockedUrl,
    });
  });

  it('should return 404 when template does not exist', async () => {
    mockLogger();

    jest.spyOn(templateRepository, 'getByIdOrFail').mockImplementation(() => {
      throw new NotFoundError({ message: ErrorMessage.templateNotFound });
    });

    const body = requestMockFactory.create();
    const event = eventMockFactory.create({
      body: JSON.stringify(body),
    });

    const result = await generateDocument(event, context);

    expect(result.statusCode).toEqual(404);
    expect(JSON.parse(result.body)).toEqual({
      message: ErrorMessage.templateNotFound,
    });
  });
});
