import { randomUUID } from 'node:crypto';

import { getEnvVariableOrFail, isLocal } from './env.helper';

afterEach(() => {
  jest.resetAllMocks();
});

describe('getEnvVariableOrFail', () => {
  it('should return env variable value when variable exists', () => {
    const value = randomUUID();
    process.env.S3_BUCKET = value;

    const result = getEnvVariableOrFail('S3_BUCKET');

    expect(result).toEqual(value);
  });

  it("should throw error when variable doesn't exists", () => {
    delete process.env.S3_BUCKET;

    try {
      getEnvVariableOrFail('S3_BUCKET');
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
