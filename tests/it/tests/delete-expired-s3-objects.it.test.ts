import { EnvironmentName } from '../../../config/enums/config.enum';
import { setEnvVarsFromConfig } from '../../../config/helpers/config.helper';
import { Lambda } from '../../../infra/cdk/enums/lambda.enum';
import { deleteExpiredS3Objects } from '../../../src/lambdas/delete-expired-s3-objects/handler';
import { ContextMockFactory } from '../../../src/mock-factories/context.mock-factory';
import { SqsEventMockFactory } from '../../../src/mock-factories/sqs-event.mock-factory';
import { mockAwsCredentials } from '../helpers/credential.helper';
import { putS3Object, refreshS3Bucket, s3ObjectExists } from '../helpers/s3.helper';

const eventMockFactory = new SqsEventMockFactory();
const context = new ContextMockFactory().create();

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

describe('deleteExpiredS3Objects', () => {
  it('should delete expired s3 objects', async () => {
    const keysToDelete = ['sample-key-1', 'sample-key-2'];

    await Promise.all(
      keysToDelete.map((key) =>
        putS3Object(process.env.S3_BUCKET!, key, Buffer.from('placeholder')),
      ),
    );

    const event = eventMockFactory.create({
      Records: [{ body: keysToDelete[0] }, { body: keysToDelete[1] }],
    });

    await deleteExpiredS3Objects(event, context);

    const [exists0, exists1] = await Promise.all([
      s3ObjectExists(process.env.S3_BUCKET!, keysToDelete[0]),
      s3ObjectExists(process.env.S3_BUCKET!, keysToDelete[1]),
    ]);
    expect(exists0).toBe(false);
    expect(exists1).toBe(false);
  });
});
