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

    return {
      tableName: dynamoDbTable.name,
    };
  },
});
