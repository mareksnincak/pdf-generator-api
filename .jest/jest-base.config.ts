import type { Config } from 'jest';

export const baseConfig: Config = {
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
};
