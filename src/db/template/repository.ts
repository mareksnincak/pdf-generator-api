import {
  ConditionalCheckFailedException,
  DeleteItemCommand,
  GetItemCommand,
  PutItemCommand,
  QueryCommand,
} from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import { type SetOptional } from 'type-fest';

import { ErrorMessage } from '../../enums/error.enum';
import { ConflictError } from '../../errors/conflict.error';
import { NotFoundError } from '../../errors/not-found.error';
import { logger } from '../../helpers/logger.helper';
import { DynamoIndex } from '../common/enums/dynamo.enum';
import { getDynamoDbClient, getTableName } from '../common/helpers/connection.helper';
import {
  decryptPaginationToken,
  encryptPaginationToken,
} from '../common/helpers/pagination.helper';

import { TemplateEntity } from './entity';
import { type Template } from './type';

export async function createOrFail(template: SetOptional<Template, 'createdAt' | 'id'>) {
  try {
    logger.info('templateRepository.createOrReplace');

    const templateEntity = new TemplateEntity(template);
    const item = templateEntity.toDynamoItem();
    const command = new PutItemCommand({
      ConditionExpression: 'attribute_not_exists(PK)',
      Item: item,
      TableName: getTableName(),
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
    Key: TemplateEntity.getDynamoPrimaryKey(params),
    TableName: getTableName(),
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

export async function getMany({
  limit,
  paginationToken,
  userId,
}: {
  limit?: number;
  paginationToken?: string;
  userId: string;
}) {
  logger.info({ userId }, 'templateRepository.getMany');

  const ExclusiveStartKey = await decryptPaginationToken({
    paginationToken,
    userId,
  });
  const partitionKey = TemplateEntity.getGsi1PartitionKey({ userId });

  const command = new QueryCommand({
    ExclusiveStartKey,
    ExpressionAttributeValues: marshall({ ':GSI1PK': partitionKey }),
    IndexName: DynamoIndex.GSI1,
    KeyConditionExpression: 'GSI1PK = :GSI1PK',
    Limit: limit,
    TableName: getTableName(),
  });

  const { Items = [], LastEvaluatedKey } = await getDynamoDbClient().send(command);

  const templates = Items.map((item) => TemplateEntity.fromDynamoItem(item));

  const nextPaginationToken = await encryptPaginationToken({
    paginationToken: LastEvaluatedKey,
    userId,
  });

  logger.info(
    {
      foundTemplates: templates.length,
    },
    'templateRepository.getMany.success',
  );
  return {
    nextPaginationToken,
    templates,
  };
}

export async function deleteByIdOrFail(params: { id: string; userId: string }) {
  logger.info(params, 'templateRepository.deleteByIdOrFail');

  const command = new DeleteItemCommand({
    Key: TemplateEntity.getDynamoPrimaryKey(params),
    ReturnValues: 'ALL_OLD',
    TableName: getTableName(),
  });

  const { Attributes } = await getDynamoDbClient().send(command);

  if (!Attributes) {
    throw new NotFoundError({
      message: ErrorMessage.templateNotFound,
    });
  }
  const deletedTemplate = TemplateEntity.fromDynamoItem(Attributes);

  logger.info('templateRepository.deleteByIdOrFail.success');
  return deletedTemplate;
}
