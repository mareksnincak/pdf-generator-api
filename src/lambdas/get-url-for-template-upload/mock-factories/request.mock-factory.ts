import { type APIGatewayProxyEventQueryStringParameters } from 'aws-lambda';
import { type GetUrlForTemplateUploadRequestDto } from '../dtos/request.dto';

export class GetUrlForTemplateUploadRequestMockFactory {
  create(
    overrides: Partial<GetUrlForTemplateUploadRequestDto> = {},
  ): GetUrlForTemplateUploadRequestDto {
    return {
      fileSizeBytes: 1024,
      ...overrides,
    };
  }

  createRaw(
    overrides: Partial<APIGatewayProxyEventQueryStringParameters> = {},
  ): APIGatewayProxyEventQueryStringParameters {
    return {
      fileSizeBytes: '1024',
      ...overrides,
    };
  }
}
