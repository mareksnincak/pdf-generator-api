import type { Config } from 'jest';
import { commonConfig } from './jest.common.config';

const config: Config = {
  ...commonConfig,
  testMatch: ['**/*.it.test.ts'],
};

export default config;
