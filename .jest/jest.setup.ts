import { join } from 'path';
import { EnvironmentName } from '../config/enums/config.enum';
import { setEnvVarsFromConfig } from '../config/helpers/config.helper';

setEnvVarsFromConfig(EnvironmentName.localTest);

process.env.CHROMIUM_LOCAL_EXECUTABLE_PATH = join(
  __dirname,
  '..',
  'infra',
  'local',
  'chromium',
  'chrome-headless-shell',
);
