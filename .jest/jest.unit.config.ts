import type { Config } from 'jest';
import { commonConfig } from './jest.common.config';

const config: Config = {
  ...commonConfig,
  testMatch: ['**/*.test.ts', '!**/*.it.test.ts', '!**/*.e2e.test.ts'],
  testTimeout: 5000,
};

export default config;
