import { OpenAPIRegistry, OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';

import { AuthorizationScope } from '../../infra/cdk/enums/authorization.enum';
import * as packageJson from '../../package.json';
import { createTemplateRoute } from '../lambdas/create-template/open-api/open-api.route';
import { deleteTemplateRoute } from '../lambdas/delete-template/open-api/open-api.route';
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

  const oauth2Auth = registry.registerComponent('securitySchemes', 'oauth2Auth', {
    type: 'oauth2',
    flows: {
      implicit: {
        authorizationUrl: authUrl,
        scopes: {
          [AuthorizationScope.pdfGeneratorReadTemplates]: 'Read templates.',
          [AuthorizationScope.pdfGeneratorWriteTemplates]: 'Modify templates.',
        },
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
        [oauth2Auth.name]: [
          AuthorizationScope.pdfGeneratorReadTemplates,
          AuthorizationScope.pdfGeneratorWriteTemplates,
        ],
      },
    ],
  });

  return openApiDocument;
}
