/// <reference path="./.sst/platform/config.d.ts" />
import { cdkEnvVarsDto } from './infra/cdk/dtos/cdk-env-vars.dto';
import * as packageJson from './package.json';
import { DynamoIndex } from './src/db/common/enums/dynamo.enum';
import { validate } from './src/helpers/validation.helper';

export default $config({
  app(input) {
    return {
      name: 'pdf-generator-api',
      removal: input?.stage === 'production' ? 'retain' : 'remove',
      home: 'aws',
    };
  },
  async run() {
    const cdkEnvVars = validate(process.env, cdkEnvVarsDto);
    const stackId = `${packageJson.name}-${cdkEnvVars.ENVIRONMENT_NAME}`;

    const dynamoDbTable = new sst.aws.Dynamo(stackId, {
      fields: {
        PK: 'string',
        SK: 'string',
        GSI1PK: 'string',
        GSI1SK: 'string',
      },
      primaryIndex: { hashKey: 'PK', rangeKey: 'SK' },
      ttl: 'expiresAt',
      stream: 'old-image',
      globalIndexes: {
        [DynamoIndex.GSI1]: {
          hashKey: 'GSI1PK',
          rangeKey: 'GSI1SK',
          projection: 'all',
        },
      },
    });

    return {
      tableName: dynamoDbTable.name,
    };
  },
});
