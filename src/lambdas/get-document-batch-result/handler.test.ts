import { EnvironmentName } from '../../../config/enums/config.enum';
import { setEnvVarsFromConfig } from '../../../config/helpers/config.helper';
import { Lambda } from '../../../infra/cdk/enums/lambda.enum';
import { DocumentBatchEntityMockFactory } from '../../db/document-batch/mock-factory';
import * as documentBatchRepository from '../../db/document-batch/repository';
import { ErrorMessage } from '../../enums/error.enum';
import { NotFoundError } from '../../errors/not-found.error';
import { mockLogger } from '../../helpers/test.helper';
import { ApiGatewayProxyWithCognitoAuthorizerEventMockFactory } from '../../mock-factories/api-gateway-proxy-with-cognito-authorizer-event.mock-factory';
import { ContextMockFactory } from '../../mock-factories/context.mock-factory';

import { getDocumentBatchResult } from './handler';
import { GetDocumentBatchResultRequestMockFactory } from './mock-factories/request.mock-factory';

const requestMockFactory = new GetDocumentBatchResultRequestMockFactory();
const eventMockFactory = new ApiGatewayProxyWithCognitoAuthorizerEventMockFactory();
const documentBatchEntity = new DocumentBatchEntityMockFactory().create();
const context = new ContextMockFactory().create();

beforeAll(() => {
  setEnvVarsFromConfig(EnvironmentName.localTest, Lambda.getDocumentBatchResult);
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('getDocumentBatchResult', () => {
  it('should return document batch result', async () => {
    jest.spyOn(documentBatchRepository, 'getByIdOrFail').mockResolvedValue(documentBatchEntity);

    const pathParameters = requestMockFactory.create();
    const event = eventMockFactory.create({
      pathParameters,
    });

    const result = await getDocumentBatchResult(event, context);

    expect(result.statusCode).toEqual(200);
    expect(JSON.parse(result.body)).toEqual({
      errors: [],
      generatedDocuments: [],
      id: documentBatchEntity.id,
      status: documentBatchEntity.status,
    });
  });

  it('should return 404 when document batch does not exist', async () => {
    mockLogger();

    jest.spyOn(documentBatchRepository, 'getByIdOrFail').mockImplementation(() => {
      throw new NotFoundError({ message: ErrorMessage.documentBatchNotFound });
    });

    const pathParameters = requestMockFactory.create();
    const event = eventMockFactory.create({
      pathParameters,
    });

    const result = await getDocumentBatchResult(event, context);

    expect(result.statusCode).toEqual(404);
    expect(JSON.parse(result.body)).toEqual({
      message: ErrorMessage.documentBatchNotFound,
    });
  });
});
