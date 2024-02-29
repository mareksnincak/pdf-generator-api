import type { Config } from 'jest';
import { commonConfig } from './jest.common.config';

const config: Config = {
  ...commonConfig,
  testMatch: ['**/*.e2e.test.ts'],
  testTimeout: 15000,
};

export default config;
