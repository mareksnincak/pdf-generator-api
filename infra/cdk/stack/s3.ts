import { type RemovalPolicy } from 'aws-cdk-lib';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { type Construct } from 'constructs';

export function createS3Bucket({
  autoDeleteObjects,
  removalPolicy,
  scope,
  stackId,
}: {
  autoDeleteObjects: boolean;
  removalPolicy: RemovalPolicy;
  scope: Construct;
  stackId: string;
}) {
  return new Bucket(scope, 's3-bucket', {
    autoDeleteObjects,
    bucketName: stackId,
    enforceSSL: true,
    removalPolicy,
  });
}
