import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { type Lambda } from '../../infra/cdk/enums/lambda.enum';
import { type EnvironmentName } from '../enums/config.enum';
import { type EnvVars } from '../types/env.type';

export function getEnvVars(environmentName: EnvironmentName): EnvVars {
  const configPath = join(__dirname, '..', 'values', `${environmentName}.config.json`);
  const configFile = readFileSync(configPath);
  const config = JSON.parse(configFile.toString()) as {
    global: Record<string, string>;
    lambda: Record<Lambda, Record<string, string>>;
  };

  const envVars = new Map<Lambda | 'global', Record<string, string>>();

  envVars.set('global', config.global);

  for (const [lambdaName, lambdaConfig] of Object.entries(config.lambda)) {
    const fullConfig = {
      ...config.global,
      ...lambdaConfig,
    };

    envVars.set(lambdaName as Lambda, fullConfig);
  }

  return envVars;
}

/**
 * Sets values from config into process.env vars. Sets global values if lambda is omitted.
 */
export function setEnvVarsFromConfig(environmentName: EnvironmentName, lambda?: Lambda) {
  const envVars = getEnvVars(environmentName);

  const values = lambda ? envVars.get(lambda) : envVars.get('global');

  if (!values) {
    throw new Error('configHelper.setEnvVarsFromConfig.missingEnvVars');
  }

  for (const [name, value] of Object.entries(values)) {
    process.env[name] = String(value);
  }
}
