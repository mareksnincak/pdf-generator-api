import { captureAWSv3Client } from 'aws-xray-sdk-core';

/**
 * Wraps an AWS SDK v3 client with X-Ray instrumentation so each SDK call
 * appears as a subsegment in the Lambda trace.
 */
export function captureAwsClient<T extends Parameters<typeof captureAWSv3Client>[0]>(client: T): T {
  /**
   * This is automatically set by Lambda when it's deployed as we are using `Tracing.ACTIVE`
   * option. We are skipping this for local environments.
   */
  if (!process.env.AWS_XRAY_DAEMON_ADDRESS) {
    return client;
  }

  return captureAWSv3Client(client);
}
