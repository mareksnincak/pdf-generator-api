import { OpenAPIRegistry, OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { createTemplateRoute } from '../lambdas/create-template/open-api/create-template.open-api';
import { getUrlForTemplateUploadRoute } from '../lambdas/get-url-for-template-upload/open-api/get-url-for-template-upload.open-api';
import * as packageJson from '../../package.json';

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
  servers: [{ url: '/' }],
});

const outputPath = join(__dirname, 'open-api.json');
writeFileSync(outputPath, JSON.stringify(openApiDocument));

console.log('Open API spec: ', outputPath);
