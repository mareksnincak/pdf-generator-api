export const getOpenApiLambda = new sst.aws.Function('GetOpenApi', {
  runtime: 'nodejs20.x',
  architecture: 'arm64',
  memory: '512 MB',
  timeout: '20 seconds',
  handler: '../../../src/lambdas/get-open-api/handler.getOpenApi',
  logging: {
    retention: $dev ? '1 day' : '1 month',
    format: 'json',
  },
});
