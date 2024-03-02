import type {
  APIGatewayProxyResult,
  APIGatewayProxyWithCognitoAuthorizerEvent,
  Context,
} from 'aws-lambda';

import { getByIdOrFail } from '../../db/template/template.repository';
import { templateIdDto } from '../../dtos/template-id.dto';
import { handleError } from '../../helpers/error.helper';
import { getUserIdFromEventOrFail } from '../../helpers/event.helper';
import { logger, setLoggerContext } from '../../helpers/logger.helper';
import { validatePathParams } from '../../helpers/validation.helper';

export async function getTemplate(
  event: APIGatewayProxyWithCognitoAuthorizerEvent,
  context: Context,
): Promise<APIGatewayProxyResult> {
  try {
    setLoggerContext(event, context);
    logger.info('getTemplate.starting');

    const validatedParams = validatePathParams(event, templateIdDto);
    logger.info(validatedParams, 'getTemplate.validatedParams');

    const { id } = validatedParams;

    const bucket = process.env.S3_BUCKET;
    if (!bucket) {
      throw new Error('getTemplate.missingS3Bucket');
    }

    const userId = getUserIdFromEventOrFail(event);
    const templateEntity = await getByIdOrFail({ id, userId });

    logger.info('deleteTemplate.success');
    return {
      statusCode: 200,
      body: JSON.stringify(templateEntity.toPublicJson()),
    };
  } catch (error) {
    return handleError({ error, logPrefix: 'deleteTemplate' });
  }
}
