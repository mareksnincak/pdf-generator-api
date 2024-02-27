import { OpenAPIRegistry, OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import { createTemplateRequestDto } from '../lambdas/create-template/dtos/create-template-request.dto';
import { createTemplateResponseDto } from '../lambdas/create-template/dtos/create-template-response.dto';
import { writeFileSync } from 'fs';
import { join } from 'path';

const registry = new OpenAPIRegistry();

registry.registerPath({
  method: 'post',
  path: '/templates',
  summary: 'Create template',
  request: {
    body: {
      content: {
        'application/json': {
          schema: createTemplateRequestDto,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Template successfully created.',
      content: {
        'application/json': {
          schema: createTemplateResponseDto,
        },
      },
    },
  },
});

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
