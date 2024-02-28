import type { Config } from 'jest';
import { baseConfig } from './.jest/jest-base.config';

const config: Config = {
  ...baseConfig,
  roots: ['./src'],
  setupFiles: ['<rootDir>/.jest/jest.setup.ts'],
  testMatch: ['**/*.test.ts'],
};

export default config;
