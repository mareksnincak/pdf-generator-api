import { randomUUID } from 'node:crypto';

import { EnvironmentName } from '../../../config/enums/config.enum';
import { setEnvVarsFromConfig } from '../../../config/helpers/config.helper';
import { Lambda } from '../../../infra/cdk/enums/lambda.enum';
import { mockAwsCredentials } from '../../../tests/it/helpers/credential.helper';
import * as sfnHelper from '../../helpers/sfn.helper';
import { mockLogger } from '../../helpers/test.helper';
import { ApiGatewayProxyWithCognitoAuthorizerEventMockFactory } from '../../mock-factories/api-gateway-proxy-with-cognito-authorizer-event.mock-factory';
import { ContextMockFactory } from '../../mock-factories/context.mock-factory';

import { startDocumentBatchGeneration } from './handler';
import { StartDocumentBatchGenerationRequestMockFactory } from './mock-factories/request.mock-factory';

const requestMockFactory = new StartDocumentBatchGenerationRequestMockFactory();
const eventMockFactory = new ApiGatewayProxyWithCognitoAuthorizerEventMockFactory();
const context = new ContextMockFactory().create();

beforeEach(() => {
  setEnvVarsFromConfig(EnvironmentName.localTest, Lambda.startDocumentBatchGeneration);
});

afterEach(() => {
  jest.resetAllMocks();
});

describe('startDocumentBatchGeneration', () => {
  it('should start state machine execution', async () => {
    const body = requestMockFactory.create();
    const event = eventMockFactory.create({
      body: JSON.stringify(body),
    });

    const startExecutionSpy = jest.spyOn(sfnHelper, 'startExecution').mockImplementation();

    const result = await startDocumentBatchGeneration(event, context);

    expect(result.statusCode).toEqual(202);

    const responseData = JSON.parse(result.body);
    expect(responseData).toEqual({
      id: expect.any(String),
    });

    const batchId = responseData.id;
    const userId = event.requestContext.authorizer.claims.sub;
    expect(startExecutionSpy).toHaveBeenCalledWith({
      name: batchId,
      stateMachineArn: 'sample-state-machine-arn',
      input: {
        userId,
        requestData: body,
      },
    });
  });

  it('should skip startExecution call when running locally', async () => {
    process.env.IS_LOCAL = 'true';

    const body = requestMockFactory.create();
    const event = eventMockFactory.create({
      body: JSON.stringify(body),
    });

    const startExecutionSpy = jest.spyOn(sfnHelper, 'startExecution');

    const result = await startDocumentBatchGeneration(event, context);

    expect(result.statusCode).toEqual(202);

    expect(JSON.parse(result.body)).toEqual({
      id: expect.any(String),
    });

    expect(startExecutionSpy).not.toHaveBeenCalled();
  });

  it('should return 400 when template refs are not unique', async () => {
    mockLogger();

    const ref = randomUUID();
    const body = requestMockFactory.create({
      documents: [{ ref }, { ref }],
    });
    const event = eventMockFactory.create({
      body: JSON.stringify(body),
    });

    const result = await startDocumentBatchGeneration(event, context);

    expect(result.statusCode).toEqual(400);

    expect(JSON.parse(result.body)).toEqual({
      message: 'Document refs must be unique',
    });
  });
});
