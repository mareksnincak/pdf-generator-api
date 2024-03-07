import { OpenAPIRegistry, OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';

import { customOAuthScopes } from '../../infra/cdk/enums/authorization.enum';
import * as packageJson from '../../package.json';
import { createTemplateRoute } from '../lambdas/create-template/open-api/open-api.route';
import { deleteTemplateRoute } from '../lambdas/delete-template/open-api/open-api.route';
import { generateDocumentRoute } from '../lambdas/generate-document-api-gw/open-api/open-api.route';
import { getTemplateRoute } from '../lambdas/get-template/open-api/open-api.route';
import { getTemplatesRoute } from '../lambdas/get-templates/open-api/open-api.route';
import { getUrlForTemplateUploadRoute } from '../lambdas/get-url-for-template-upload/open-api/open-api.route';

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

  const oAuth2AuthScopes: Record<string, string> = {};
  for (const scope of Object.values(customOAuthScopes)) {
    oAuth2AuthScopes[scope.pdfGeneratorName] = scope.description;
  }

  const oAuth2Auth = registry.registerComponent('securitySchemes', 'oauth2Auth', {
    type: 'oauth2',
    flows: {
      implicit: {
        authorizationUrl: authUrl,
        scopes: oAuth2AuthScopes,
      },
    },
  });

  const generator = new OpenApiGeneratorV3(registry.definitions);

  const openApiDocument = generator.generateDocument({
    openapi: '3.0.0',
    info: {
      version: packageJson.version,
      title: 'PDF generator API',
      description: packageJson.description,
    },
    servers: [{ url: apiUrl }],
    security: [
      {
        [oAuth2Auth.name]: Object.keys(oAuth2AuthScopes),
      },
    ],
  });

  return openApiDocument;
}
