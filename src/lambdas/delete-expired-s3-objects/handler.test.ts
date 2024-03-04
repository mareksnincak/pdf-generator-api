import { EnvironmentName } from '../../../config/enums/config.enum';
import { setEnvVarsFromConfig } from '../../../config/helpers/config.helper';
import { Lambda } from '../../../infra/cdk/enums/lambda.enum';
import * as s3Helper from '../../helpers/s3.helper';
import { ContextMockFactory } from '../../mock-factories/context.mock-factory';
import { SqsEventMockFactory } from '../../mock-factories/sqs-event.mock-factory';

import { deleteExpiredS3Objects } from './handler';

const eventMockFactory = new SqsEventMockFactory();
const context = new ContextMockFactory().create();

beforeAll(() => {
  setEnvVarsFromConfig(EnvironmentName.localTest, Lambda.deleteExpiredS3Objects);
});

afterEach(() => {
  jest.resetAllMocks();
});

describe('deleteExpiredS3Objects', () => {
  it('should delete expired s3 objects', async () => {
    const deleteObjectsSpy = jest.spyOn(s3Helper, 'deleteObjects').mockImplementation();
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

    expect(deleteObjectsSpy).toHaveBeenCalledWith({
      bucket: 'pdf-generator-api-test',
      keys: keysToDelete,
    });
  });
});
