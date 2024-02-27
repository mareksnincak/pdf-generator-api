import { OpenAPIRegistry, OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { createTemplateRoute } from '../lambdas/create-template/open-api/create-template.open-api';
import { getUrlForTemplateUploadRoute } from '../lambdas/get-url-for-template-upload/open-api/get-url-for-template-upload.open-api';

const registry = new OpenAPIRegistry();

registry.registerPath(createTemplateRoute);
registry.registerPath(getUrlForTemplateUploadRoute);

const generator = new OpenApiGeneratorV3(registry.definitions);

const openApiDocument = generator.generateDocument({
  openapi: '3.0.0',
  info: {
    version: '1.0.0',
    title: 'PDF Generator API',
    description: 'API for generating dynamic PDF documents.',
  },
  servers: [{ url: '/' }],
});

const outputPath = join(__dirname, 'open-api.json');
writeFileSync(outputPath, JSON.stringify(openApiDocument));

console.log('Open API spec: ', outputPath);
