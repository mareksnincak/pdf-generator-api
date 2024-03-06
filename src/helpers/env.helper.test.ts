import { randomUUID } from 'node:crypto';

import { getEnvVariableOrFail, isLocal } from './env.helper';

afterEach(() => {
  jest.resetAllMocks();
});

describe('getEnvVariableOrFail', () => {
  it('should return env variable value when variable exists', () => {
    const value = randomUUID();
    process.env.SOME_TESTING_ENV_VARIABLE = value;

    const result = getEnvVariableOrFail('SOME_TESTING_ENV_VARIABLE');

    expect(result).toEqual(value);
  });

  it("should throw error when variable doesn't exists", () => {
    delete process.env.SOME_TESTING_ENV_VARIABLE;

    try {
      getEnvVariableOrFail('SOME_TESTING_ENV_VARIABLE');
      expect(true).toEqual(false);
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toEqual('envHelper.getEnvVariableOrFail.missing');
    }
  });
});

describe('isLocal', () => {
  it("should return true when IS_LOCAL === 'true'", () => {
    process.env.IS_LOCAL = 'true';

    const result = isLocal();

    expect(result).toEqual(true);
  });

  it("should return false when IS_LOCAL === 'false'", () => {
    process.env.IS_LOCAL = 'false';

    const result = isLocal();

    expect(result).toEqual(false);
  });

  it('should return false when IS_LOCAL is not set', () => {
    delete process.env.IS_LOCAL;

    const result = isLocal();

    expect(result).toEqual(false);
  });
});
