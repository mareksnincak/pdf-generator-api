import { OpenApiGeneratorV3, OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';

import { customOAuthScopes } from '../../infra/cdk/enums/authorization.enum';
import * as packageJson from '../../package.json';
import { createTemplateRoute } from '../lambdas/create-template/open-api/open-api.route';
import { deleteTemplateRoute } from '../lambdas/delete-template/open-api/open-api.route';
import { generateDocumentRoute } from '../lambdas/generate-document/open-api/open-api.route';
import { getDocumentBatchResultRoute } from '../lambdas/get-document-batch-result/open-api/open-api.route';
import { getTemplateRoute } from '../lambdas/get-template/open-api/open-api.route';
import { getTemplatesRoute } from '../lambdas/get-templates/open-api/open-api.route';
import { getUrlForTemplateUploadRoute } from '../lambdas/get-url-for-template-upload/open-api/open-api.route';
import { startDocumentBatchGenerationRoute } from '../lambdas/start-document-batch-generation/open-api/open-api.route';

export function generateOpenApi({
  apiUrl = '/',
  authUrl = 'https://example.com',
}: {
  apiUrl?: string;
  authUrl?: string;
} = {}) {
  const registry = new OpenAPIRegistry();

  registry.registerPath(createTemplateRoute);
  registry.registerPath(getTemplateRoute);
  registry.registerPath(getTemplatesRoute);
  registry.registerPath(deleteTemplateRoute);
  registry.registerPath(getUrlForTemplateUploadRoute);
  registry.registerPath(generateDocumentRoute);
  registry.registerPath(startDocumentBatchGenerationRoute);
  registry.registerPath(getDocumentBatchResultRoute);

  const oAuth2AuthScopes: Record<string, string> = {};
  for (const scope of Object.values(customOAuthScopes)) {
    oAuth2AuthScopes[scope.pdfGeneratorName] = scope.description;
  }

  const oAuth2Auth = registry.registerComponent('securitySchemes', 'oauth2Auth', {
    flows: {
      implicit: {
        authorizationUrl: authUrl,
        scopes: oAuth2AuthScopes,
      },
    },
    type: 'oauth2',
  });

  const generator = new OpenApiGeneratorV3(registry.definitions);

  const openApiDocument = generator.generateDocument({
    info: {
      description: packageJson.description,
      title: 'PDF generator API',
      version: packageJson.version,
    },
    openapi: '3.0.0',
    security: [
      {
        [oAuth2Auth.name]: Object.keys(oAuth2AuthScopes),
      },
    ],
    servers: [{ url: apiUrl }],
  });

  return openApiDocument;
}
