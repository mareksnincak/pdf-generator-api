import { DynamoIndex } from '../../src/db/common/enums/dynamo.enum';

export const dynamoDbTable = new sst.aws.Dynamo('PDF generator', {
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
