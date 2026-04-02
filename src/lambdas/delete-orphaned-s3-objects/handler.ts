import { type AttributeValue } from '@aws-sdk/client-dynamodb';
import type { DynamoDBRecord, DynamoDBStreamEvent } from 'aws-lambda';

import { DocumentBatchEntity } from '../../db/document-batch/entity';
import { TemplateEntity } from '../../db/template/entity';
import { getEnvVariableOrFail } from '../../helpers/env.helper';
import { ErrorFormat } from '../../helpers/error.helper';
import { wrapHandler } from '../../helpers/handler.helper';
import { logger } from '../../helpers/logger.helper';
import { deleteObjects } from '../../helpers/s3.helper';

function getKeysToDelete({ dynamodb, eventName }: DynamoDBRecord): string[] {
  logger.info({ eventName, keys: dynamodb?.Keys }, 'deleteOrphanedS3Objects.handleRecord');
  logger.debug({ dynamodb }, 'deleteOrphanedS3Objects.dynamoDbValue');

  const PK = dynamodb?.Keys?.PK.S;
  const item = dynamodb?.OldImage as Record<string, AttributeValue> | undefined;
  if (eventName !== 'REMOVE' || !PK || !item) {
    logger.warn('deleteOrphanedS3Objects.handleRecord.invalidEvent');
    return [];
  }

  if (PK.startsWith(TemplateEntity.pkPrefix)) {
    const entity = TemplateEntity.fromDynamoItem(item);
    const keys = [entity.s3Key];

    logger.info({ keys }, 'deleteOrphanedS3Objects.handleRecord.templateEntity.result');
    return keys;
  }

  if (PK.startsWith(DocumentBatchEntity.pkPrefix)) {
    const entity = DocumentBatchEntity.fromDynamoItem(item);
    const keys = entity.generatedDocuments.map((document) => document.s3Key);

    logger.info({ keys }, 'deleteOrphanedS3Objects.handleRecord.documentBatchEntity.result');
    return keys;
  }

  logger.info('deleteOrphanedS3Objects.handleRecord.otherEntity');
  return [];
}

async function handler(event: DynamoDBStreamEvent) {
  logger.info('deleteOrphanedS3Objects.starting');
  logger.debug(event, 'deleteOrphanedS3Objects.event');

  const bucket = getEnvVariableOrFail('S3_BUCKET');

  const keysToDelete = event.Records.flatMap((record) => getKeysToDelete(record));

  await deleteObjects({
    bucket,
    keys: keysToDelete,
  });

  logger.info('deleteOrphanedS3Objects.success');
}

export const deleteOrphanedS3Objects = wrapHandler(handler, {
  errorFormat: ErrorFormat.RAW,
  logPrefix: 'deleteOrphanedS3Objects',
});
