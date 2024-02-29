import type { Config } from 'jest';
import { commonConfig } from './jest.common.config';

const config: Config = {
  ...commonConfig,
  testMatch: ['**/*.e2e.test.ts'],
};

export default config;
