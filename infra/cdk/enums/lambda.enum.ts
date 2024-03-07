export enum Lambda {
  getOpenApi = 'get-open-api',
  getUrlForTemplateUpload = 'get-url-for-template-upload',
  createTemplate = 'create-template',
  getTemplate = 'get-template',
  getTemplates = 'get-templates',
  deleteTemplate = 'delete-template',
  setDefaultUserPassword = 'set-default-user-password',
  generateDocumentFromApiEvent = 'generate-document-from-api-event',
  generateDocumentFromSfnEvent = 'generate-document-from-sfn-event',
  startDocumentBatchGeneration = 'start-document-batch-generation',
  getDocumentBatchResult = 'get-document-batch-result',
  deleteExpiredS3Objects = 'delete-expired-s3-objects',
}
