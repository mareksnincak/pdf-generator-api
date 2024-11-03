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
    // const vpc = new sst.aws.Vpc('MyVpc', { bastion: true });
    // const dynamoDbTable = new sst.aws.Bucket();
  },
});
