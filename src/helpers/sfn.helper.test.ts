import { randomUUID } from 'node:crypto';

import { SFNClient, StartExecutionCommand } from '@aws-sdk/client-sfn';

import { startExecution } from './sfn.helper';

afterEach(() => {
  jest.clearAllMocks();
});

describe('startExecution', () => {
  it('should start state machine execution', async () => {
    const stateMachineArn = 'sample-arn';
    const name = 'sample-name';
    const input = {
      foo: 'bar',
    };

    const startExecutionCommandResult = {
      executionId: randomUUID(),
    };

    const sfnClientSpy = jest
      .spyOn(SFNClient.prototype, 'send')
      .mockImplementation(() => startExecutionCommandResult);

    const result = await startExecution({
      stateMachineArn,
      name,
      input,
    });

    expect(result).toEqual(startExecutionCommandResult);

    const sfnClientArgs = sfnClientSpy.mock.calls[0]?.[0];
    expect(sfnClientArgs).toBeInstanceOf(StartExecutionCommand);
    expect(sfnClientArgs.input).toEqual({
      stateMachineArn,
      name,
      input: JSON.stringify(input),
    });
  });
});
