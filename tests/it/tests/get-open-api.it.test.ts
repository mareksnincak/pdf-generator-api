import { SSMClient } from '@aws-sdk/client-ssm';

import { EnvironmentName } from '../../../config/enums/config.enum';
import { setEnvVarsFromConfig } from '../../../config/helpers/config.helper';
import { Lambda } from '../../../infra/cdk/enums/lambda.enum';
import { getOpenApi } from '../../../src/lambdas/get-open-api/handler';
import { ApiGatewayProxyEventMockFactory } from '../../../src/mock-factories/api-gateway-proxy-event.mock-factory';
import { ContextMockFactory } from '../../../src/mock-factories/context.mock-factory';

const event = new ApiGatewayProxyEventMockFactory().create();
const context = new ContextMockFactory().create();

beforeAll(async () => {
  setEnvVarsFromConfig(EnvironmentName.localTest, Lambda.getOpenApi);
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('getOpenApi', () => {
  it('should return open-api', async () => {
    const ssmParamValue = {
      apiUrl: 'http://api.example.com/path',
      authUrl: 'http://auth.example.com/path',
    };

    const ssmClientSpy = jest.spyOn(SSMClient.prototype, 'send').mockImplementation(() => ({
      Parameter: {
        Value: JSON.stringify(ssmParamValue),
      },
    }));

    const result = await getOpenApi(event, context);

    expect(result.statusCode).toEqual(200);

    const body = JSON.parse(result.body);
    expect(body).toHaveProperty('openapi', '3.0.0');
    expect(body).toHaveProperty('servers', [{ url: ssmParamValue.apiUrl }]);
    expect(body).toHaveProperty(
      'components.securitySchemes.oauth2Auth.flows.implicit.authorizationUrl',
      ssmParamValue.authUrl,
    );

    expect(ssmClientSpy.mock.lastCall?.[0].input).toEqual({
      Name: 'sample-open-api-ssm-param-name',
    });
  });
});
