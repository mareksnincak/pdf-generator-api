import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';

import { getEnvVariableOrFail, isLocal } from '../../helpers/env.helper';
import { handleApiError } from '../../helpers/error.helper';
import { logger, setLoggerContext } from '../../helpers/logger.helper';
import { getSsmParam } from '../../helpers/ssm.helper';
import { generateOpenApi } from '../../open-api/generate-open-api.schema';

import { type OpenApiParamsSsmParam } from './types/input.type';

let openApiDocument: ReturnType<typeof generateOpenApi>;

async function getOpenApiParams() {
  if (isLocal()) {
    return;
  }

  const ssmParamName = getEnvVariableOrFail('OPEN_API_SSM_PARAM_NAME');
  const value = await getSsmParam(ssmParamName);

  const openApiParams = JSON.parse(value) as OpenApiParamsSsmParam;
  logger.debug(openApiParams, 'getOpenApi.getOpenApiParams.openApiParams');

  return openApiParams;
}

async function getOpenApiDocument() {
  const openApiParams = await getOpenApiParams();
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
    return handleApiError({ error, logPrefix: 'getOpenApi' });
  }
}
