import { App } from 'aws-cdk-lib';

import { CdkStack } from './lib/cdk.stack';
import { EnvironmentName } from '../../config/enums/config.enum';

const app = new App();

const environmentName = (process.env.ENVIRONMENT_NAME as EnvironmentName) ?? EnvironmentName.local;
const environmentId = `pdf-generator-api-${environmentName}`;

new CdkStack({ scope: app, id: environmentId, environmentName });
