import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { logger, setLoggerContext } from '../../helpers/logger.helper';
import { createOrReplaceMany } from '../../db/template/template.repository';
import { TemplateType } from '../../db/template/template.enum';

export async function uploadTemplate(
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<APIGatewayProxyResult> {
  setLoggerContext(event, context);
  logger.info('uploadTemplate.starting');

  const { templateIds } = await createOrReplaceMany([
    { name: 'Test template', type: TemplateType.htmlHandlebars },
  ]);
  const templateId = templateIds[0];

  const response = {
    templateId,
  };
  logger.info({ response }, 'uploadTemplate.response');
  return {
    body: JSON.stringify(response),
    statusCode: 200,
  };
}
