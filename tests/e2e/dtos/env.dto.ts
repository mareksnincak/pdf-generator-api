import { z } from 'zod';

export const e2eEnvVarsDto = z.object({
  E2E_BASE_URL: z.string().min(1),
  E2E_AUTH_USER_POOL_ID: z.string().min(1),
  E2E_AUTH_USER_POOL_CLIENT_ID: z.string().min(1),
  E2E_AUTH_USER_CREDENTIALS_SECRET_NAME: z.string().min(1),
});

export type E2eEnvVarsDto = z.infer<typeof e2eEnvVarsDto>;
