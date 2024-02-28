import { z } from 'zod';
import { EnvironmentName } from '../../../config/enums/config.enum';

export const cdkEnvVarsDto = z.object({
  ENVIRONMENT_NAME: z.nativeEnum(EnvironmentName).optional().default(EnvironmentName.local),
  FORCE_STATIC_HASH: z.coerce.boolean().optional().default(false),
});

export type CdkEnvVarsDto = z.infer<typeof cdkEnvVarsDto>;
