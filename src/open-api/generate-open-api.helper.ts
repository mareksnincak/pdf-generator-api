import { OpenAPIRegistry, OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import { createTemplateRoute } from '../lambdas/create-template/open-api/create-template.open-api';
import { getUrlForTemplateUploadRoute } from '../lambdas/get-url-for-template-upload/open-api/get-url-for-template-upload.open-api';
import * as packageJson from '../../package.json';

export function generateOpenApi(apiUrl = '/') {
  const registry = new OpenAPIRegistry();

  registry.registerPath(createTemplateRoute);
  registry.registerPath(getUrlForTemplateUploadRoute);

  const generator = new OpenApiGeneratorV3(registry.definitions);

  const openApiDocument = generator.generateDocument({
    openapi: '3.0.0',
    info: {
      version: packageJson.version,
      title: 'PDF generator API',
      description: packageJson.description,
    },
    servers: [{ url: apiUrl }],
  });

  return openApiDocument;
}
