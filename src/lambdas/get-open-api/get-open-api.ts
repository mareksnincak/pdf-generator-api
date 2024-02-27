import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { logger, setLoggerContext } from '../../helpers/logger.helper';
import { handleError } from '../../helpers/error.helper';
import { generateOpenApi } from '../../open-api/generate-open-api.helper';

let openApiDocument: ReturnType<typeof generateOpenApi>;

export async function getOpenApi(
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<APIGatewayProxyResult> {
  try {
    setLoggerContext(event, context);
    logger.info('getOpenApi.starting');

    if (!openApiDocument) {
      openApiDocument = generateOpenApi(process.env.API_URL);
    }

    logger.info('getOpenApi.success');
    return {
      body: JSON.stringify(openApiDocument),
      statusCode: 200,
    };
  } catch (error) {
    return handleError({ error, logPrefix: 'getOpenApi' });
  }
}
