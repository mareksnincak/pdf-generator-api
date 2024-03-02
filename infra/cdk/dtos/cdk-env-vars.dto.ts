import { z } from 'zod';

import { EnvironmentName } from '../../../config/enums/config.enum';

export const cdkEnvVarsDto = z.object({
  ENVIRONMENT_NAME: z.nativeEnum(EnvironmentName).optional().default(EnvironmentName.local),
  FORCE_STATIC_HASH: z
    .enum(['true', 'false'])
    .optional()
    .default('false')
    .transform((value) => value === 'true'),
  RETAIN_STATEFUL_RESOURCES: z
    .enum(['true', 'false'])
    .optional()
    .default('true')
    .transform((value) => value === 'true'),
});

export type CdkEnvVarsDto = z.infer<typeof cdkEnvVarsDto>;
