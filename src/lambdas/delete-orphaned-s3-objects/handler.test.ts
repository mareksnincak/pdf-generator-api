import { randomUUID } from 'node:crypto';

import { type AttributeValue } from 'aws-lambda';

import { EnvironmentName } from '../../../config/enums/config.enum';
import { setEnvVarsFromConfig } from '../../../config/helpers/config.helper';
import { Lambda } from '../../../infra/cdk/enums/lambda.enum';
import { DocumentBatchEntityMockFactory } from '../../db/document-batch/mock-factory';
import { TemplateEntityMockFactory } from '../../db/template/mock-factory';
import * as s3Helper from '../../helpers/s3.helper';
import { ContextMockFactory } from '../../mock-factories/context.mock-factory';
import { DynamoDbStreamEventMockFactory } from '../../mock-factories/dynamo-db-stream-event.mock-factory';

import { deleteOrphanedS3Objects } from './handler';

const eventMockFactory = new DynamoDbStreamEventMockFactory();
const context = new ContextMockFactory().create();
const templateMockFactory = new TemplateEntityMockFactory();
const documentBatchMockFactory = new DocumentBatchEntityMockFactory();

beforeAll(() => {
  setEnvVarsFromConfig(EnvironmentName.localTest, Lambda.deleteOrphanedS3Objects);
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('deleteOrphanedS3Objects', () => {
  it('should delete template s3 key', async () => {
    const deleteObjectsSpy = jest.spyOn(s3Helper, 'deleteObjects').mockImplementation();

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

    expect(deleteObjectsSpy).toHaveBeenCalledWith({
      bucket: 'pdf-generator-api-test',
      keys: [template.s3Key],
    });
  });

  it('should delete document batch s3 key', async () => {
    const deleteObjectsSpy = jest.spyOn(s3Helper, 'deleteObjects').mockImplementation();

    const generatedDocumentS3Key1 = randomUUID();
    const generatedDocumentS3Key2 = randomUUID();
    const documentBatch = documentBatchMockFactory.create({
      generatedDocuments: [{ s3Key: generatedDocumentS3Key1 }, { s3Key: generatedDocumentS3Key2 }],
    });
    const item = documentBatch.toDynamoItem() as Record<string, AttributeValue>;

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

    expect(deleteObjectsSpy).toHaveBeenCalledWith({
      bucket: 'pdf-generator-api-test',
      keys: [generatedDocumentS3Key1, generatedDocumentS3Key2],
    });
  });
});
