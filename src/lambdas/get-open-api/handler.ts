import type { APIGatewayProxyEvent } from 'aws-lambda';

import { getEnvVariableOrFail } from '../../helpers/env.helper';
import { ErrorFormat } from '../../helpers/error.helper';
import { wrapHandler } from '../../helpers/handler.helper';
import { logger } from '../../helpers/logger.helper';
import { getSsmParam } from '../../helpers/ssm.helper';
import { generateOpenApi } from '../../open-api/generate-open-api.schema';

import { type OpenApiParamsSsmParam } from './types/input.type';

let openApiDocument: ReturnType<typeof generateOpenApi> | undefined;

async function getOpenApiParams() {
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

async function handler(_event: APIGatewayProxyEvent) {
  logger.info('getOpenApi.starting');

  if (!openApiDocument) {
    openApiDocument = await getOpenApiDocument();
  }

  logger.info('getOpenApi.success');
  return {
    body: JSON.stringify(openApiDocument),
    statusCode: 200,
  };
}

export const getOpenApi = wrapHandler(handler, {
  errorFormat: ErrorFormat.API,
  logPrefix: 'getOpenApi',
});
