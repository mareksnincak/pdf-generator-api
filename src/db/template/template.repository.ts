import { type PutRequest } from '@aws-sdk/client-dynamodb';
import { logger } from '../../helpers/logger.helper';
import { TemplateEntity } from './template.entity';
import { writeBatch } from '../common/helpers/batch.helper';
import { type Template } from './template.type';
import { type Optional } from 'utility-types';

export async function createOrReplaceMany(templates: Optional<Template, 'id'>[]) {
  logger.info('templateRepository.createOrReplaceMany.start');

  const templateIds: string[] = [];
  const putTemplatesBatch: { PutRequest: PutRequest }[] = await Promise.all(
    templates.map(async (template) => {
      const templateEntity = new TemplateEntity(template);
      templateIds.push(templateEntity.id);

      const item = await templateEntity.toDynamoDbItem();
      return {
        PutRequest: {
          Item: item,
        },
      };
    }),
  );

  logger.info({ templateIds }, 'templateRepository.createOrReplaceMany.templateIds');

  await writeBatch(putTemplatesBatch);

  logger.info('templateRepository.createOrReplaceMany.success', { templateIds });
  return { templateIds };
}
