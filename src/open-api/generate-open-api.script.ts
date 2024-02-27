import { writeFileSync } from 'fs';
import { join } from 'path';
import { generateOpenApi } from './generate-open-api.helper';

const openApiDocument = generateOpenApi();
const outputPath = join(__dirname, 'open-api.json');

writeFileSync(outputPath, JSON.stringify(openApiDocument));

console.log('Open API spec: ', outputPath);
