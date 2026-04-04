import { S3Client } from '@aws-sdk/client-s3';
import { captureAWSv3Client } from 'aws-xray-sdk-core';

import { captureAwsClient } from './tracing.helper';

jest.mock('aws-xray-sdk-core', () => ({
  captureAWSv3Client: jest.fn(),
}));

const captureAWSv3ClientMock = jest.mocked(captureAWSv3Client);

afterEach(() => {
  jest.clearAllMocks();
  delete process.env.AWS_XRAY_DAEMON_ADDRESS;
});

describe('captureAWSClient', () => {
  it('should return client as-is when AWS_XRAY_DAEMON_ADDRESS is not set', () => {
    const client = {} as unknown as S3Client;

    const result = captureAwsClient(client);

    expect(result).toBe(client);
    expect(captureAWSv3ClientMock).not.toHaveBeenCalled();
  });

  it('should wrap client with X-Ray when AWS_XRAY_DAEMON_ADDRESS is set', () => {
    process.env.AWS_XRAY_DAEMON_ADDRESS = '127.0.0.1:2000';
    const client = { foo: 'bar ' } as unknown as S3Client;
    const wrappedClient = { baz: 'qux' } as unknown as S3Client;
    captureAWSv3ClientMock.mockReturnValue(wrappedClient);

    const result = captureAwsClient(client);

    expect(captureAWSv3ClientMock).toHaveBeenCalledWith(client);
    expect(result).toBe(wrappedClient);
  });
});
