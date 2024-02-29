import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { logger, setLoggerContext } from '../../helpers/logger.helper';
import { deleteById } from '../../db/template/template.repository';
import { deleteTemplateRequestDto } from './dtos/request.dto';
import { handleError } from '../../helpers/error.helper';
import { validatePathParams } from '../../helpers/validation.helper';

export async function deleteTemplate(
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<APIGatewayProxyResult> {
  try {
    setLoggerContext(event, context);
    logger.info('deleteTemplate.starting');

    const validatedData = validatePathParams(event, deleteTemplateRequestDto);
    logger.info(validatedData, 'deleteTemplate.validatedData');

    const { id } = validatedData;

    // TODO delete from s3
    // TODO handle 404
    // TODO tests
    await deleteById(id);

    logger.info('deleteTemplate.success');
    return {
      statusCode: 204,
      body: '',
    };
  } catch (error) {
    return handleError({ error, logPrefix: 'createTemplate' });
  }
}
