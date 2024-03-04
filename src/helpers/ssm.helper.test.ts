import { GetParameterCommand, SSMClient } from '@aws-sdk/client-ssm';

import { getSsmParam } from './ssm.helper';
import { mockLogger } from './test.helper';

afterEach(() => {
  jest.resetAllMocks();
});

describe('getSsmParam', () => {
  it('should return ssm param value', async () => {
    const name = 'sample-ssm-param';
    const value = 'sample-value';

    const ssmClientSpy = jest.spyOn(SSMClient.prototype, 'send').mockImplementation(() => ({
      Parameter: {
        Value: value,
      },
    }));

    const ssmParam = await getSsmParam(name);

    expect(ssmParam).toEqual(value);

    const ssmClientArgs = ssmClientSpy.mock.calls[0]?.[0];
    expect(ssmClientArgs).toBeInstanceOf(GetParameterCommand);
    expect(ssmClientArgs.input).toEqual({
      Name: name,
    });
  });

  it('should throw error when value is undefined', async () => {
    mockLogger();
    const name = 'sample-ssm-param';
    const value = undefined;

    jest.spyOn(SSMClient.prototype, 'send').mockImplementation(() => ({
      Parameter: {
        Value: value,
      },
    }));

    try {
      await getSsmParam(name);
      expect(true).toEqual(false);
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toEqual('ssmHelper.getSsmParam.undefinedValue');
    }
  });
});
