import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { logger, setLoggerContext } from '../../helpers/logger.helper';
import { deleteById } from '../../db/template/template.repository';
import { deleteTemplateRequestDto } from './dtos/request.dto';
import { handleError } from '../../helpers/error.helper';
import { validatePathParams } from '../../helpers/validation.helper';
import { DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3';

const s3Client = new S3Client();

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

    // TODO handle 404
    // TODO tests
    // TODO move s3 operations to s3 helper
    const deletedTemplate = await deleteById(id);
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: deletedTemplate.s3Key,
      }),
    );

    logger.info('deleteTemplate.success');
    return {
      statusCode: 204,
      body: '',
    };
  } catch (error) {
    return handleError({ error, logPrefix: 'deleteTemplate' });
  }
}
