import type { Config } from 'jest';

export const commonConfig: Config = {
  maxWorkers: '50%',
  preset: 'ts-jest',
  transform: {
    '^.+\\.(t|j)s$': [
      'ts-jest',
      {
        isolatedModules: true,
      },
    ],
  },
  setupFiles: ['<rootDir>/.jest/jest.setup.ts'],
  rootDir: '../',
  testMatch: ['**/*.test.ts'],
  testTimeout: 15000,
};

export default commonConfig;
