import { GetUrlForTemplateUploadRequestMockFactory } from './mock-factories/get-url-for-template-upload-request.mock-factory';
import { ContextMockFactory } from '../../mock-factories/context.mock-factory';
import { ApiGatewayProxyEventMockFactory } from '../../mock-factories/api-gateway-proxy-event.mock-factory';
import { S3Client } from '@aws-sdk/client-s3';
import * as s3RequestPresigner from '@aws-sdk/s3-request-presigner';
import { getUrlForTemplateUpload } from './get-url-for-template-upload';
import * as crypto from 'node:crypto';

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

beforeEach(() => {
  jest.resetAllMocks();
});

describe('getUrlForTemplateUpload', () => {
  it('should return data needed for template upload', async () => {
    const presignedUrl = 'http://presigned.example.com';
    const uploadId = crypto.randomUUID();

    jest.spyOn(crypto, 'randomUUID').mockReturnValue(uploadId);
    jest.spyOn(S3Client.prototype, 'send').mockImplementation();
    jest.spyOn(s3RequestPresigner, 'getSignedUrl').mockResolvedValue(presignedUrl);

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
  });
});
