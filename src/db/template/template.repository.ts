import { DeleteItemCommand, GetItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { type Optional } from 'utility-types';

import { ErrorMessage } from '../../enums/error.enum';
import { NotFoundError } from '../../errors/not-found.error';
import { logger } from '../../helpers/logger.helper';
import { getDynamoDbClient, getTableName } from '../common/helpers/connection.helper';

import { TemplateEntity } from './template.entity';
import { type Template } from './template.type';

export async function createOrReplace(template: Optional<Template, 'id'>) {
  logger.info('templateRepository.createOrReplace');

  const templateEntity = new TemplateEntity(template);
  const item = await templateEntity.toDynamoItem();
  const command = new PutItemCommand({
    TableName: getTableName(),
    Item: item,
  });

  await getDynamoDbClient().send(command);

  logger.info('templateRepository.createOrReplace.success');
  return templateEntity;
}

export async function getByIdOrFail(params: { id: string; userId: string }) {
  logger.info(params, 'templateRepository.getById');

  const command = new GetItemCommand({
    TableName: getTableName(),
    Key: TemplateEntity.getDynamoPartitionKey(params),
  });

  const { Item } = await getDynamoDbClient().send(command);
  if (!Item) {
    throw new NotFoundError({
      message: ErrorMessage.templateNotFound,
    });
  }

  const template = await TemplateEntity.fromDynamoItem(Item);

  logger.info('templateRepository.getById.success');
  return template;
}

export async function deleteById(params: { id: string; userId: string }) {
  logger.info(params, 'templateRepository.deleteById');

  const command = new DeleteItemCommand({
    TableName: getTableName(),
    Key: TemplateEntity.getDynamoPartitionKey(params),
    ReturnValues: 'ALL_OLD',
  });

  const { Attributes } = await getDynamoDbClient().send(command);

  if (!Attributes) {
    throw new NotFoundError({
      message: ErrorMessage.templateNotFound,
    });
  }
  const deletedTemplate = await TemplateEntity.fromDynamoItem(Attributes);

  logger.info('templateRepository.deleteById.success');
  return deletedTemplate;
}
