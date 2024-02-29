import * as crypto from 'node:crypto';

import * as s3RequestPresigner from '@aws-sdk/s3-request-presigner';

import { EnvironmentName } from '../../../config/enums/config.enum';
import { setEnvVarsFromConfig } from '../../../config/helpers/config.helper';
import { Lambda } from '../../../infra/cdk/enums/lambda.enum';
import { getUrlForTemplateUpload } from '../../../src/lambdas/get-url-for-template-upload/handler';
import { GetUrlForTemplateUploadRequestMockFactory } from '../../../src/lambdas/get-url-for-template-upload/mock-factories/request.mock-factory';
import { ApiGatewayProxyEventMockFactory } from '../../../src/mock-factories/api-gateway-proxy-event.mock-factory';
import { ContextMockFactory } from '../../../src/mock-factories/context.mock-factory';

jest.mock('@aws-sdk/s3-request-presigner', () => {
  return {
    __esModule: true,
    ...jest.requireActual('@aws-sdk/s3-request-presigner'),
  };
});

jest.mock('node:crypto', () => {
  return {
    __esModule: true,
    ...jest.requireActual<Record<string, unknown>>('node:crypto'),
  };
});

const requestMockFactory = new GetUrlForTemplateUploadRequestMockFactory();
const eventMockFactory = new ApiGatewayProxyEventMockFactory();
const context = new ContextMockFactory().create();

beforeAll(async () => {
  setEnvVarsFromConfig(EnvironmentName.localTest, Lambda.getUrlForTemplateUpload);
});

afterEach(() => {
  jest.resetAllMocks();
});

describe('getUrlForTemplateUpload', () => {
  it('should return data needed for template upload', async () => {
    const presignedUrl = 'http://presigned.example.com';
    const uploadId = crypto.randomUUID();

    jest.spyOn(crypto, 'randomUUID').mockReturnValue(uploadId);
    const getSignedUrlSpy = jest
      .spyOn(s3RequestPresigner, 'getSignedUrl')
      .mockResolvedValue(presignedUrl);

    const queryStringParameters = requestMockFactory.createRaw();
    const event = eventMockFactory.create({
      queryStringParameters,
    });

    const result = await getUrlForTemplateUpload(event, context);

    expect(result.statusCode).toEqual(200);
    expect(JSON.parse(result.body)).toEqual({
      uploadId,
      url: presignedUrl,
    });

    const getSignedUrlArgs = getSignedUrlSpy.mock.lastCall;
    expect(getSignedUrlArgs?.[1].input).toEqual({
      Bucket: 'pdf-generator-api-it-test',
      ContentLength: 1024,
      Key: `templates/uploads/${uploadId}`,
    });
  });
});
