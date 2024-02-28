import { EnvironmentName } from '../../config/enums/config.enum';
import { setEnvVarsFromConfig } from '../../config/helpers/config.helper';

setEnvVarsFromConfig(EnvironmentName.itTest);
