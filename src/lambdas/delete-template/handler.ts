import type {
  APIGatewayProxyResult,
  APIGatewayProxyWithCognitoAuthorizerEvent,
  Context,
} from 'aws-lambda';

import { deleteByIdOrFail } from '../../db/template/repository';
import { getEnvVariableOrFail } from '../../helpers/env.helper';
import { handleApiError } from '../../helpers/error.helper';
import { getUserIdFromEventOrFail } from '../../helpers/event.helper';
import { logger, setLoggerContext } from '../../helpers/logger.helper';
import { deleteObject } from '../../helpers/s3.helper';
import { validatePathParams } from '../../helpers/validation.helper';

import { deleteTemplateRequestDto } from './dtos/request.dto';

export async function deleteTemplate(
  event: APIGatewayProxyWithCognitoAuthorizerEvent,
  context: Context,
): Promise<APIGatewayProxyResult> {
  try {
    setLoggerContext(event, context);
    logger.info('deleteTemplate.starting');

    const validatedData = validatePathParams(event, deleteTemplateRequestDto);
    logger.info(validatedData, 'deleteTemplate.validatedData');

    const { id } = validatedData;

    const bucket = getEnvVariableOrFail('S3_BUCKET');
    const userId = getUserIdFromEventOrFail(event);
    const deletedTemplate = await deleteByIdOrFail({ id, userId });
    await deleteObject({ bucket, key: deletedTemplate.s3Key });

    logger.info('deleteTemplate.success');
    return {
      statusCode: 204,
      body: '',
    };
  } catch (error) {
    return handleApiError({ error, logPrefix: 'deleteTemplate' });
  }
}
