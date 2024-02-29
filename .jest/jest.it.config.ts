import type { Config } from 'jest';
import { commonConfig } from './jest.common.config';

const config: Config = {
  ...commonConfig,
  testMatch: ['**/*.it.test.ts'],
  testTimeout: 5000,
};

export default config;
