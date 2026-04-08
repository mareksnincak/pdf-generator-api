import { type AttributeValue } from 'aws-lambda';

import { EnvironmentName } from '../../../config/enums/config.enum';
import { setEnvVarsFromConfig } from '../../../config/helpers/config.helper';
import { Lambda } from '../../../infra/cdk/enums/lambda.enum';
import { TemplateEntityMockFactory } from '../../../src/db/template/mock-factory';
import { deleteOrphanedS3Objects } from '../../../src/lambdas/delete-orphaned-s3-objects/handler';
import { ContextMockFactory } from '../../../src/mock-factories/context.mock-factory';
import { DynamoDbStreamEventMockFactory } from '../../../src/mock-factories/dynamo-db-stream-event.mock-factory';
import { mockAwsCredentials } from '../helpers/credential.helper';
import { putS3Object, refreshS3Bucket, s3ObjectExists } from '../helpers/s3.helper';

const eventMockFactory = new DynamoDbStreamEventMockFactory();
const context = new ContextMockFactory().create();
const templateMockFactory = new TemplateEntityMockFactory();

beforeAll(() => {
  setEnvVarsFromConfig(EnvironmentName.localTest, Lambda.deleteExpiredS3Objects);
  mockAwsCredentials();
});

beforeEach(async () => {
  await refreshS3Bucket(process.env.S3_BUCKET!);
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('deleteOrphanedS3Objects', () => {
  it('should delete orphaned s3 objects', async () => {
    const template = templateMockFactory.create();
    const item = template.toDynamoItem() as Record<string, AttributeValue>;

    await putS3Object(process.env.S3_BUCKET!, template.s3Key, Buffer.from('placeholder'));

    const event = eventMockFactory.create({
      Records: [
        {
          dynamodb: { Keys: { PK: item.PK }, OldImage: item },
          eventName: 'REMOVE',
        },
      ],
    });

    await deleteOrphanedS3Objects(event, context);

    expect(await s3ObjectExists(process.env.S3_BUCKET!, template.s3Key)).toBe(false);
  });
});
