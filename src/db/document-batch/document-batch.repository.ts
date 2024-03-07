import { GetItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { type SetOptional } from 'type-fest';

import { ErrorMessage } from '../../enums/error.enum';
import { NotFoundError } from '../../errors/not-found.error';
import { logger } from '../../helpers/logger.helper';
import { getDynamoDbClient, getTableName } from '../common/helpers/connection.helper';

import { DocumentBatchEntity } from './document-batch.entity';
import { type DocumentBatch } from './document-batch.type';

export async function create(
  documentBatch: SetOptional<DocumentBatch, 'id' | 'errors' | 'generatedDocuments'>,
) {
  logger.info('documentBatchRepository.create');

  const documentBatchEntity = new DocumentBatchEntity(documentBatch);
  const item = await documentBatchEntity.toDynamoItem();
  const command = new PutItemCommand({
    TableName: getTableName(),
    Item: item,
    ConditionExpression: 'attribute_not_exists(PK)',
  });

  await getDynamoDbClient().send(command);

  logger.info(documentBatchEntity.primaryKey, 'documentBatchRepository.create.success');
  return documentBatchEntity;
}

export async function getById(params: { id: string; userId: string }) {
  logger.info(params, 'documentBatchRepository.getById');

  const command = new GetItemCommand({
    TableName: getTableName(),
    Key: DocumentBatchEntity.getDynamoPrimaryKey(params),
  });

  const { Item } = await getDynamoDbClient().send(command);
  if (!Item) {
    logger.info('documentBatchRepository.getById.notFound');
    return null;
  }

  const documentBatchEntity = DocumentBatchEntity.fromDynamoItem(Item);

  logger.info(documentBatchEntity.primaryKey, 'documentBatchRepository.getById.success');
  return documentBatchEntity;
}

export async function getByIdOrFail(params: { id: string; userId: string }) {
  logger.info(params, 'documentBatchRepository.getByIdOrFail');

  const documentBatchEntity = await getById(params);
  if (!documentBatchEntity) {
    throw new NotFoundError({
      message: ErrorMessage.documentBatchNotFound,
    });
  }

  logger.info(documentBatchEntity.primaryKey, 'documentBatchRepository.getByIdOrFail.success');
  return documentBatchEntity;
}
