import { SSMClient } from '@aws-sdk/client-ssm';
import { ApiGatewayProxyEventMockFactory } from '../../mock-factories/api-gateway-proxy-event.mock-factory';
import { ContextMockFactory } from '../../mock-factories/context.mock-factory';
import * as generateOpenApiHelper from '../../open-api/generate-open-api.helper';
import { getOpenApi } from './get-open-api';

const event = new ApiGatewayProxyEventMockFactory().create();
const context = new ContextMockFactory().create();

describe('getOpenApi', () => {
  it('should return open-api', async () => {
    const ssmParamValue = 'customSsmParamValue';
    jest.spyOn(SSMClient.prototype, 'send').mockImplementation(() => ({
      Parameter: {
        Value: ssmParamValue,
      },
    }));

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
