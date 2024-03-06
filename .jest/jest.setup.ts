import { join } from 'path';
import { EnvironmentName } from '../config/enums/config.enum';
import { setEnvVarsFromConfig } from '../config/helpers/config.helper';
import isCi from 'is-ci';

setEnvVarsFromConfig(EnvironmentName.localTest);

if (!isCi) {
  process.env.CHROMIUM_LOCAL_EXECUTABLE_PATH = join(
    __dirname,
    '..',
    'infra',
    'local',
    'chromium',
    'chrome-headless-shell',
  );
}
