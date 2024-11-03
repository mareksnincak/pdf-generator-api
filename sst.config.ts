/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: 'pdf-generator-api',
      removal: input?.stage === 'production' ? 'retain' : 'remove',
      home: 'aws',
    };
  },
  async run() {
    const { dynamoDbTable } = await import('./infra/sst/dynamo');
    const { s3Bucket } = await import('./infra/sst/s3');
    const { kmsKey } = await import('./infra/sst/kms');
    const { expiredS3ObjectsQueue } = await import('./infra/sst/sqs');
    const { getOpenApiLambda } = await import('./infra/sst/lambda');
    const { api } = await import('./infra/sst/api');

    return {
      tableName: dynamoDbTable.name,
      s3BucketName: s3Bucket.name,
      kmsKeyArn: kmsKey.arn,
      expiredS3ObjectsQueueArn: expiredS3ObjectsQueue.arn,
      getOpenApiLambdaArn: getOpenApiLambda.arn,
      apiUrl: api.url,
    };
  },
});
