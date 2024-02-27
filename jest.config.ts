import type { Config } from 'jest';

const config: Config = {
  maxWorkers: '50%',
  preset: 'ts-jest',
  roots: ['./src'],
  setupFiles: ['<rootDir>/.jest/jest.setup.ts'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.(t|j)s$': [
      'ts-jest',
      {
        isolatedModules: true,
      },
    ],
  },
};

export default config;
