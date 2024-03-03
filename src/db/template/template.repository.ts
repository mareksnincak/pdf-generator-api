import {
  ConditionalCheckFailedException,
  DeleteItemCommand,
  GetItemCommand,
  PutItemCommand,
  QueryCommand,
} from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import { type Optional } from 'utility-types';

import { ErrorMessage } from '../../enums/error.enum';
import { ConflictError } from '../../errors/conflict.error';
import { NotFoundError } from '../../errors/not-found.error';
import { logger } from '../../helpers/logger.helper';
import { DynamoIndex } from '../common/enums/dynamo.enum';
import { getDynamoDbClient, getTableName } from '../common/helpers/connection.helper';

import { TemplateEntity } from './template.entity';
import { type Template } from './template.type';

export async function createOrReplace(template: Optional<Template, 'id'>) {
  try {
    logger.info('templateRepository.createOrReplace');

    const templateEntity = new TemplateEntity(template);
    const item = await templateEntity.toDynamoItem();
    const command = new PutItemCommand({
      TableName: getTableName(),
      Item: item,
      ConditionExpression: 'attribute_not_exists(PK)',
    });

    await getDynamoDbClient().send(command);

    logger.info(templateEntity.primaryKey, 'templateRepository.createOrReplace.success');
    return templateEntity;
  } catch (error) {
    if (error instanceof ConditionalCheckFailedException) {
      throw new ConflictError({
        message: ErrorMessage.templateAlreadyExists,
      });
    }

    throw error;
  }
}

export async function getById(params: { id: string; userId: string }) {
  logger.info(params, 'templateRepository.getById');

  const command = new GetItemCommand({
    TableName: getTableName(),
    Key: TemplateEntity.getDynamoPrimaryKey(params),
  });

  const { Item } = await getDynamoDbClient().send(command);
  if (!Item) {
    logger.info('templateRepository.getById.notFound');
    return null;
  }

  const template = TemplateEntity.fromDynamoItem(Item);

  logger.info(template.primaryKey, 'templateRepository.getById.success');
  return template;
}

export async function getByIdOrFail(params: { id: string; userId: string }) {
  logger.info(params, 'templateRepository.getByIdOrFail');

  const template = await getById(params);
  if (!template) {
    throw new NotFoundError({
      message: ErrorMessage.templateNotFound,
    });
  }

  logger.info(template.primaryKey, 'templateRepository.getByIdOrFail.success');
  return template;
}

export async function getMany({ userId }: { userId: string }) {
  logger.info({ userId }, 'templateRepository.getMany');

  const partitionKey = TemplateEntity.getGsi1PartitionKey({ userId });

  const command = new QueryCommand({
    TableName: getTableName(),
    IndexName: DynamoIndex.GSI1,
    // TODO pagination
    Limit: 10,
    KeyConditionExpression: 'GSI1PK = :GSI1PK',
    ExpressionAttributeValues: marshall({ ':GSI1PK': partitionKey }),
  });

  const { Items = [] } = await getDynamoDbClient().send(command);

  const templates = Items.map((item) => TemplateEntity.fromDynamoItem(item));

  logger.info(
    {
      foundTemplates: templates.length,
    },
    'templateRepository.getMany.success',
  );
  return templates;
}

export async function deleteById(params: { id: string; userId: string }) {
  logger.info(params, 'templateRepository.deleteById');

  const command = new DeleteItemCommand({
    TableName: getTableName(),
    Key: TemplateEntity.getDynamoPrimaryKey(params),
    ReturnValues: 'ALL_OLD',
  });

  const { Attributes } = await getDynamoDbClient().send(command);

  if (!Attributes) {
    throw new NotFoundError({
      message: ErrorMessage.templateNotFound,
    });
  }
  const deletedTemplate = TemplateEntity.fromDynamoItem(Attributes);

  logger.info('templateRepository.deleteById.success');
  return deletedTemplate;
}
