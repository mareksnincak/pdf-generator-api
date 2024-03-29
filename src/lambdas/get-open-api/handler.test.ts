import { EnvironmentName } from '../../../config/enums/config.enum';
import { setEnvVarsFromConfig } from '../../../config/helpers/config.helper';
import { Lambda } from '../../../infra/cdk/enums/lambda.enum';
import * as ssmHelper from '../../helpers/ssm.helper';
import { ApiGatewayProxyEventMockFactory } from '../../mock-factories/api-gateway-proxy-event.mock-factory';
import { ContextMockFactory } from '../../mock-factories/context.mock-factory';
import * as generateOpenApiHelper from '../../open-api/generate-open-api.schema';

import { getOpenApi } from './handler';

const event = new ApiGatewayProxyEventMockFactory().create();
const context = new ContextMockFactory().create();

beforeAll(() => {
  setEnvVarsFromConfig(EnvironmentName.localTest, Lambda.getOpenApi);
});

describe('getOpenApi', () => {
  it('should return open-api', async () => {
    const ssmParamValue = {
      apiUrl: 'sample-api-url',
      authUrl: 'sample-auth-url',
    };

    jest.spyOn(ssmHelper, 'getSsmParam').mockResolvedValue(JSON.stringify(ssmParamValue));

    const openApi = {
      openapi: '3.0.0',
      info: {
        title: 'title',
        version: 'version',
      },
      paths: {},
    };

    const generateOpenApiSpy = jest
      .spyOn(generateOpenApiHelper, 'generateOpenApi')
      .mockReturnValue(openApi);

    const result = await getOpenApi(event, context);

    expect(result.statusCode).toEqual(200);
    expect(JSON.parse(result.body)).toEqual(openApi);

    expect(generateOpenApiSpy).toHaveBeenCalledWith(ssmParamValue);
  });
});
