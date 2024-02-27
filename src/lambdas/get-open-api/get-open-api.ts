import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { logger, setLoggerContext } from '../../helpers/logger.helper';
import { handleError } from '../../helpers/error.helper';
import { generateOpenApi } from '../../open-api/generate-open-api.helper';
import { GetParameterCommand, SSMClient } from '@aws-sdk/client-ssm';

let openApiDocument: ReturnType<typeof generateOpenApi>;
const ssmClient = new SSMClient();

async function getOpenApiDocument() {
  const apiUrlSsmParam = await ssmClient.send(
    new GetParameterCommand({
      Name: process.env.API_URL_SSM_PARAM_NAME,
    }),
  );

  return generateOpenApi(apiUrlSsmParam.Parameter?.Value);
}

export async function getOpenApi(
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<APIGatewayProxyResult> {
  try {
    setLoggerContext(event, context);
    logger.info('getOpenApi.starting');

    if (!openApiDocument) {
      openApiDocument = await getOpenApiDocument();
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
