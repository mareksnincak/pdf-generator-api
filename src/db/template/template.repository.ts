import { DeleteItemCommand, GetItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { logger } from '../../helpers/logger.helper';
import { TemplateEntity } from './template.entity';
import { type Template } from './template.type';
import { type Optional } from 'utility-types';
import { getDynamoDbClient, getTableName } from '../common/helpers/connection.helper';

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

export async function findById(id: string) {
  logger.info({ id }, 'templateRepository.findById');

  const command = new GetItemCommand({
    TableName: getTableName(),
    Key: TemplateEntity.getDynamoPartitionKey({ id }),
  });

  const { Item } = await getDynamoDbClient().send(command);
  if (!Item) {
    logger.info('templateRepository.findById.notFound');
    return null;
  }

  const template = await TemplateEntity.fromDynamoItem(Item);

  logger.info('templateRepository.findById.success');
  return template;
}

export async function deleteById(id: string) {
  logger.info({ id }, 'templateRepository.deleteById');

  const command = new DeleteItemCommand({
    TableName: getTableName(),
    Key: TemplateEntity.getDynamoPartitionKey({ id }),
  });

  await getDynamoDbClient().send(command);

  logger.info('templateRepository.deleteById.success');
}
