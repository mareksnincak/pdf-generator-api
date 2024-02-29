import type { Config } from 'jest';
import { commonConfig } from './jest.common.config';

const config: Config = {
  ...commonConfig,
  testMatch: ['**/*.test.ts', '!**/*.it.test.ts', '!**/*.e2e.test.ts'],
};

export default config;
