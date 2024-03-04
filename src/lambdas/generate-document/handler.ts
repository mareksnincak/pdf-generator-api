import type {
  APIGatewayProxyResult,
  APIGatewayProxyWithCognitoAuthorizerEvent,
  Context,
} from 'aws-lambda';

import { getByIdOrFail } from '../../db/template/template.repository';
import { handleError } from '../../helpers/error.helper';
import { getUserIdFromEventOrFail } from '../../helpers/event.helper';
import { logger, setLoggerContext } from '../../helpers/logger.helper';
import { validateBody } from '../../helpers/validation.helper';

import { generateDocumentRequestDto } from './dtos/request.dto';
import { type GenerateDocumentResponseDto } from './dtos/response.dto';

export async function generateDocument(
  event: APIGatewayProxyWithCognitoAuthorizerEvent,
  context: Context,
): Promise<APIGatewayProxyResult> {
  try {
    setLoggerContext(event, context);
    logger.info('generateDocument.starting');

    const validatedData = validateBody(event, generateDocumentRequestDto);
    logger.info(validatedData, 'generateDocument.validatedData');

    const { templateId } = validatedData;
    const userId = getUserIdFromEventOrFail(event);
    await getByIdOrFail({ id: templateId, userId });

    const response: GenerateDocumentResponseDto = {
      url: 'https://example.com',
    };
    logger.info('generateDocument.success');
    return {
      body: JSON.stringify(response),
      statusCode: 200,
    };
  } catch (error) {
    return handleError({ error, logPrefix: 'createTemplate' });
  }
}
