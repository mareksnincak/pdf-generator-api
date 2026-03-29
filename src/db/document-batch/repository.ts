import { GetItemCommand, PutItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import { type SetOptional } from 'type-fest';

import { ErrorMessage } from '../../enums/error.enum';
import { NotFoundError } from '../../errors/not-found.error';
import { logger } from '../../helpers/logger.helper';
import { getDynamoDbClient, getTableName } from '../common/helpers/connection.helper';

import { DocumentBatchEntity } from './entity';
import { type DocumentBatch } from './type';

export async function create(
  documentBatch: SetOptional<DocumentBatch, 'createdAt' | 'errors' | 'generatedDocuments' | 'id'>,
) {
  logger.info('documentBatchRepository.create');

  const documentBatchEntity = new DocumentBatchEntity(documentBatch);
  const item = documentBatchEntity.toDynamoItem();
  const command = new PutItemCommand({
    ConditionExpression: 'attribute_not_exists(PK)',
    Item: item,
    TableName: getTableName(),
  });

  await getDynamoDbClient().send(command);

  logger.info(documentBatchEntity.primaryKey, 'documentBatchRepository.create.success');
  return documentBatchEntity;
}

export async function getById(params: { id: string; userId: string }) {
  logger.info(params, 'documentBatchRepository.getById');

  const command = new GetItemCommand({
    Key: DocumentBatchEntity.getDynamoPrimaryKey(params),
    TableName: getTableName(),
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
    if (!DocumentBatchEntity.updatableFields.has(key)) {
      return;
    }

    updateExpressionItems.push(`#field${index} = :value${index}`);
    expressionAttributeNames[`#field${index}`] = key;
    expressionAttributeValues[`:value${index}`] = value;
  });

  const updateExpression = `SET ${updateExpressionItems.join(', ')}`;

  const command = new UpdateItemCommand({
    ConditionExpression: 'attribute_exists(PK)',
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: marshall(expressionAttributeValues),
    Key: DocumentBatchEntity.getDynamoPrimaryKey({ id, userId }),
    TableName: getTableName(),
    UpdateExpression: updateExpression,
  });

  await getDynamoDbClient().send(command);

  logger.info('documentBatchRepository.updateById.success');
}
