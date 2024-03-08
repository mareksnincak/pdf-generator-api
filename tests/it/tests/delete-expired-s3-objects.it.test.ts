import { DeleteObjectsCommand, S3Client } from '@aws-sdk/client-s3';

import { EnvironmentName } from '../../../config/enums/config.enum';
import { setEnvVarsFromConfig } from '../../../config/helpers/config.helper';
import { Lambda } from '../../../infra/cdk/enums/lambda.enum';
import { deleteExpiredS3Objects } from '../../../src/lambdas/delete-expired-s3-objects/handler';
import { ContextMockFactory } from '../../../src/mock-factories/context.mock-factory';
import { SqsEventMockFactory } from '../../../src/mock-factories/sqs-event.mock-factory';

const eventMockFactory = new SqsEventMockFactory();
const context = new ContextMockFactory().create();

beforeAll(async () => {
  setEnvVarsFromConfig(EnvironmentName.localTest, Lambda.deleteExpiredS3Objects);
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('deleteExpiredS3Objects', () => {
  it('should delete expired s3 objects', async () => {
    const s3ClientSpy = jest.spyOn(S3Client.prototype, 'send').mockImplementation(() => ({}));
    const keysToDelete = ['sample-key-1', 'sample-key-2'];

    const event = eventMockFactory.create({
      Records: [
        {
          body: keysToDelete[0],
        },
        {
          body: keysToDelete[1],
        },
      ],
    });

    await deleteExpiredS3Objects(event, context);

    const s3ClientArgs = s3ClientSpy.mock.calls[0]?.[0];
    expect(s3ClientArgs).toBeInstanceOf(DeleteObjectsCommand);
    expect(s3ClientArgs.input).toEqual({
      Bucket: 'pdf-generator-api-test',
      Delete: {
        Objects: [
          {
            Key: keysToDelete[0],
          },
          {
            Key: keysToDelete[1],
          },
        ],
      },
    });
  });
});
