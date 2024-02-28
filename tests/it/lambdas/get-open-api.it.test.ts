import { SSMClient } from '@aws-sdk/client-ssm';
import { ApiGatewayProxyEventMockFactory } from '../../../src/mock-factories/api-gateway-proxy-event.mock-factory';
import { ContextMockFactory } from '../../../src/mock-factories/context.mock-factory';
import { getOpenApi } from '../../../src/lambdas/get-open-api/get-open-api';
import { setEnvVarsFromConfig } from '../../../config/helpers/config.helper';
import { EnvironmentName } from '../../../config/enums/config.enum';
import { Lambda } from '../../../infra/cdk/enums/lambda.enum';

const event = new ApiGatewayProxyEventMockFactory().create();
const context = new ContextMockFactory().create();

beforeAll(async () => {
  setEnvVarsFromConfig(EnvironmentName.itTest, Lambda.getOpenApi);
});

afterEach(() => {
  jest.resetAllMocks();
});

describe('getOpenApi', () => {
  it('should return open-api', async () => {
    const ssmParamValue = 'http://custom.example.com/path';
    const ssmClientSpy = jest.spyOn(SSMClient.prototype, 'send').mockImplementation(() => ({
      Parameter: {
        Value: ssmParamValue,
      },
    }));

    const result = await getOpenApi(event, context);

    expect(result.statusCode).toEqual(200);

    const body = JSON.parse(result.body);
    expect(body).toHaveProperty('openapi', '3.0.0');
    expect(body).toHaveProperty('servers', [{ url: ssmParamValue }]);

    expect(ssmClientSpy.mock.lastCall?.[0].input).toEqual({
      Name: 'pdf-generator-api-api-url-it-test',
    });
  });
});