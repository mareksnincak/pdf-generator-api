import { GetParameterCommand, SSMClient } from '@aws-sdk/client-ssm';
import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';

import { handleError } from '../../helpers/error.helper';
import { logger, setLoggerContext } from '../../helpers/logger.helper';
import { generateOpenApi } from '../../open-api/generate-open-api.schema';

import { type OpenApiParamsSsmParam } from './types/input.type';

let openApiDocument: ReturnType<typeof generateOpenApi>;
const ssmClient = new SSMClient();

async function getOpenApiDocument() {
  const ssmParamName = process.env.OPEN_API_SSM_PARAM_NAME;

  logger.debug(ssmParamName, 'getOpenApi.getOpenApiDocument.ssmParamName');
  const apiUrlSsmParam = await ssmClient.send(
    new GetParameterCommand({
      Name: ssmParamName,
    }),
  );

  const value = apiUrlSsmParam.Parameter?.Value;
  if (!value) {
    throw new Error();
  }

  const openApiParams = JSON.parse(value) as OpenApiParamsSsmParam;

  logger.debug(openApiParams, 'getOpenApi.getOpenApiDocument.apiUrl');
  return generateOpenApi(openApiParams);
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
