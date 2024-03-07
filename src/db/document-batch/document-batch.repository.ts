import { GetItemCommand, PutItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
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

export async function updateById(
  identifiers: { id: string; userId: string },
  updatedData: Partial<Omit<DocumentBatch, 'id' | 'userId'>>,
) {
  logger.info({ identifiers, updatedData }, 'documentBatchRepository.updateById');

  const { id, userId } = identifiers;

  const updateExpressionItems: string[] = [];
  const expressionAttributeNames: Record<string, string> = {};
  const expressionAttributeValues: Record<string, unknown> = {};

  Object.entries(updatedData).forEach(([key, value], index) => {
    updateExpressionItems.push(`#field${index} = :value${index}`);
    expressionAttributeNames[`#field${index}`] = key;
    expressionAttributeValues[`:value${index}`] = value;
  });

  const updateExpression = `SET ${updateExpressionItems.join(', ')}`;

  const command = new UpdateItemCommand({
    TableName: getTableName(),
    Key: DocumentBatchEntity.getDynamoPrimaryKey({ id, userId }),
    ConditionExpression: 'attribute_exists(PK)',
    UpdateExpression: updateExpression,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: marshall(expressionAttributeValues),
  });

  await getDynamoDbClient().send(command);

  logger.info('documentBatchRepository.updateById.success');
}
