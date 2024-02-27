export default {
  preset: 'ts-jest',
  roots: ['./src'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.(t|j)s$': [
      'ts-jest',
      {
        isolatedModules: true,
      },
    ],
  },
  maxWorkers: '50%',
};
