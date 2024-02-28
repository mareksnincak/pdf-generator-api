import { App } from 'aws-cdk-lib';

import { CdkStack } from './lib/cdk.stack';
import { validate } from '../../src/helpers/validation.helper';
import { cdkEnvVarsDto } from './dtos/cdk-env-vars.dto';

const app = new App();

const cdkEnvVars = validate(process.env, cdkEnvVarsDto);
const environmentId = `pdf-generator-api-${cdkEnvVars.ENVIRONMENT_NAME}`;

new CdkStack({ scope: app, id: environmentId, cdkEnvVars });
