import {
  createTemplate,
  deleteTemplate,
  generateDocumentFromApiEvent,
  getDocumentBatchResult,
  getOpenApi,
  getTemplate,
  getTemplates,
  getUrlForTemplateUpload,
} from './lambda';

export const api = new sst.aws.ApiGatewayV2('Api');

api.route('GET /', getOpenApi.arn);

api.route('GET /templates', getTemplates.arn);
api.route('POST /templates', createTemplate.arn);
api.route('GET /templates/{id}', getTemplate.arn);
api.route('DELETE /templates/{id}', deleteTemplate.arn);
api.route('GET /templates/upload-url', getUrlForTemplateUpload.arn);

api.route('POST /documents/generate', generateDocumentFromApiEvent.arn);
api.route('GET /documents/batch/{id}', getDocumentBatchResult.arn);
