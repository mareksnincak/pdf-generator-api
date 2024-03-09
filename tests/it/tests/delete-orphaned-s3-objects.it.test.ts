import { DeleteObjectsCommand, S3Client } from '@aws-sdk/client-s3';
import { type AttributeValue } from 'aws-lambda';

import { EnvironmentName } from '../../../config/enums/config.enum';
import { setEnvVarsFromConfig } from '../../../config/helpers/config.helper';
import { Lambda } from '../../../infra/cdk/enums/lambda.enum';
import { TemplateEntityMockFactory } from '../../../src/db/template/mock-factory';
import { deleteOrphanedS3Objects } from '../../../src/lambdas/delete-orphaned-s3-objects/handler';
import { ContextMockFactory } from '../../../src/mock-factories/context.mock-factory';
import { DynamoDbStreamEventMockFactory } from '../../../src/mock-factories/dynamo-db-stream-event.mock-factory';

const eventMockFactory = new DynamoDbStreamEventMockFactory();
const context = new ContextMockFactory().create();
const templateMockFactory = new TemplateEntityMockFactory();

beforeAll(async () => {
  setEnvVarsFromConfig(EnvironmentName.localTest, Lambda.deleteExpiredS3Objects);
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('deleteOrphanedS3Objects', () => {
  it('should delete orphaned s3 objects', async () => {
    const s3ClientSpy = jest.spyOn(S3Client.prototype, 'send').mockImplementation(() => ({}));

    const template = templateMockFactory.create();
    const item = template.toDynamoItem() as Record<string, AttributeValue>;

    const event = eventMockFactory.create({
      Records: [
        {
          eventName: 'REMOVE',
          dynamodb: {
            Keys: {
              PK: item.PK,
            },
            OldImage: item,
          },
        },
      ],
    });

    await deleteOrphanedS3Objects(event, context);

    const s3ClientArgs = s3ClientSpy.mock.calls[0]?.[0];
    expect(s3ClientArgs).toBeInstanceOf(DeleteObjectsCommand);
    expect(s3ClientArgs.input).toEqual({
      Bucket: 'pdf-generator-api-test',
      Delete: {
        Objects: [
          {
            Key: template.s3Key,
          },
        ],
      },
    });
  });
});
