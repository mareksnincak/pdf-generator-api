export function getCommonLambdaProps() {
  return {
    runtime: 'nodejs20.x',
    architecture: 'arm64',
    memory: '512 MB',
    timeout: '20 seconds',
    logging: {
      retention: $dev ? '1 day' : '1 month',
      format: 'json',
    },
  } satisfies Omit<sst.aws.FunctionArgs, 'handler'>;
}

export const getOpenApi = new sst.aws.Function('GetOpenApi', {
  ...getCommonLambdaProps(),
  handler: '../../../src/lambdas/get-open-api/handler.getOpenApi',
});

export const getUrlForTemplateUpload = new sst.aws.Function('GetUrlForTemplateUpload', {
  ...getCommonLambdaProps(),
  handler: '../../../src/lambdas/get-url-for-template-upload/handler.getUrlForTemplateUpload',
});

export const createTemplate = new sst.aws.Function('CreateTemplate', {
  ...getCommonLambdaProps(),
  handler: '../../../src/lambdas/create-template/handler.createTemplate',
});

export const getTemplate = new sst.aws.Function('GetTemplate', {
  ...getCommonLambdaProps(),
  handler: '../../../src/lambdas/get-template/handler.getTemplate',
});

export const getTemplates = new sst.aws.Function('GetTemplates', {
  ...getCommonLambdaProps(),
  handler: '../../../src/lambdas/get-templates/handler.getTemplates',
});

export const deleteTemplate = new sst.aws.Function('DeleteTemplate', {
  ...getCommonLambdaProps(),
  handler: '../../../src/lambdas/delete-template/handler.deleteTemplate',
});

export const setDefaultUserPassword = new sst.aws.Function('SetDefaultUserPassword', {
  ...getCommonLambdaProps(),
  handler: '../../../src/lambdas/set-default-user-password/handler.setDefaultUserPassword',
});

export const generateDocumentFromApiEvent = new sst.aws.Function('GenerateDocumentFromApiEvent', {
  ...getCommonLambdaProps(),
  handler:
    '../../../src/lambdas/generate-document-from-api-event/handler.generateDocumentFromApiEvent',
});

export const generateDocumentFromSfnEvent = new sst.aws.Function('GenerateDocumentFromSfnEvent', {
  ...getCommonLambdaProps(),
  handler:
    '../../../src/lambdas/generate-document-from-sfn-event/handler.generateDocumentFromSfnEvent',
});

export const getDocumentBatchResult = new sst.aws.Function('GetDocumentBatchResult', {
  ...getCommonLambdaProps(),
  handler: '../../../src/lambdas/get-document-batch-result/handler.getDocumentBatchResult',
});

export const storeDocumentBatchResult = new sst.aws.Function('StoreDocumentBatchResult', {
  ...getCommonLambdaProps(),
  handler: '../../../src/lambdas/store-document-batch-result/handler.storeDocumentBatchResult',
});

export const deleteExpiredS3Objects = new sst.aws.Function('DeleteExpiredS3Objects', {
  ...getCommonLambdaProps(),
  handler: '../../../src/lambdas/delete-expired-s3-objects/handler.deleteExpiredS3Objects',
});

export const deleteOrphanedS3Objects = new sst.aws.Function('DeleteOrphanedS3Objects', {
  ...getCommonLambdaProps(),
  handler: '../../../src/lambdas/delete-orphaned-s3-objects/handler.deleteOrphanedS3Objects',
});
