import { App } from 'aws-cdk-lib';

import * as packageJson from '../../package.json';
import { validate } from '../../src/helpers/validation.helper';

import { cdkEnvVarsDto } from './dtos/cdk-env-vars.dto';
import { CdkStack } from './lib/cdk.stack';

const app = new App();

const cdkEnvVars = validate(process.env, cdkEnvVarsDto);

const stackId = `${packageJson.name}-${cdkEnvVars.ENVIRONMENT_NAME}`;

new CdkStack({ scope: app, id: stackId, cdkEnvVars });
