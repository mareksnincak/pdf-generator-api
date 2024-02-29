import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { logger, setLoggerContext } from '../../helpers/logger.helper';
import { deleteById } from '../../db/template/template.repository';
import { deleteTemplateRequestDto } from './dtos/request.dto';
import { handleError } from '../../helpers/error.helper';
import { validatePathParams } from '../../helpers/validation.helper';
import { deleteObject } from '../../helpers/s3.helper';

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

    const bucket = process.env.S3_BUCKET;
    if (!bucket) {
      throw new Error('deleteTemplate.missingS3Bucket');
    }

    // TODO tests
    const deletedTemplate = await deleteById(id);
    await deleteObject({ bucket, key: deletedTemplate.s3Key });

    logger.info('deleteTemplate.success');
    return {
      statusCode: 204,
      body: '',
    };
  } catch (error) {
    return handleError({ error, logPrefix: 'deleteTemplate' });
  }
}
