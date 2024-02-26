import { PutItemCommand } from '@aws-sdk/client-dynamodb';
import { logger } from '../../helpers/logger.helper';
import { TemplateEntity } from './template.entity';
import { type Template } from './template.type';
import { type Optional } from 'utility-types';
import { getDynamoDbClient, getTableName } from '../common/helpers/connection.helper';

export async function createOrReplace(template: Optional<Template, 'id'>) {
  logger.info('templateRepository.createOrReplace.start');

  const templateEntity = new TemplateEntity(template);
  const item = await templateEntity.toDynamoDbItem();
  const command = new PutItemCommand({
    TableName: getTableName(),
    Item: item,
  });

  await getDynamoDbClient().send(command);

  logger.info('templateRepository.createOrReplace.success');
  return templateEntity;
}
