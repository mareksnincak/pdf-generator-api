import { type RemovalPolicy } from 'aws-cdk-lib';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { type Construct } from 'constructs';

export function createS3Bucket({
  scope,
  stackId,
  removalPolicy,
}: {
  scope: Construct;
  stackId: string;
  removalPolicy: RemovalPolicy;
}) {
  return new Bucket(scope, 's3-bucket', {
    enforceSSL: true,
    bucketName: stackId,
    removalPolicy,
  });
}
