import type { Config } from 'jest';
import { baseConfig } from '../../.jest/jest-base.config';

const config: Config = {
  ...baseConfig,
  rootDir: '../../',
  testMatch: ['**/*.it.test.ts'],
  setupFiles: ['<rootDir>/tests/it/jest.it.setup.ts'],
};

export default config;
