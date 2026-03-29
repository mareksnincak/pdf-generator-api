import type { Config } from 'jest';

export const commonConfig: Config = {
  maxWorkers: '50%',
  preset: 'ts-jest',
  rootDir: '../',
  setupFiles: ['<rootDir>/.jest/jest.setup.ts'],
  testMatch: ['**/*.test.ts'],
  testTimeout: 15000,
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
};

export default commonConfig;
