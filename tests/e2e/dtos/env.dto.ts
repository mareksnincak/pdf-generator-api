import { z } from 'zod';

import { LOCAL_E2E_BASE_URL } from '../constants/url.constant';

export const e2eEnvVarsDto = z.object({
  E2E_BASE_URL: z.string().optional().default(LOCAL_E2E_BASE_URL),
  E2E_AUTH_USER_POOL_ID: z.string().optional().default('unused'),
  E2E_AUTH_USER_POOL_CLIENT_ID: z.string().optional().default('unused'),
  E2E_AUTH_USER_CREDENTIALS_SECRET_NAME: z.string().optional().default('unused'),
});

export type E2eEnvVarsDto = z.infer<typeof e2eEnvVarsDto>;
