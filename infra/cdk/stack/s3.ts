import { Duration, type RemovalPolicy } from 'aws-cdk-lib';
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
  const bucket = new Bucket(scope, 's3-bucket', {
    autoDeleteObjects,
    bucketName: stackId,
    enforceSSL: true,
    removalPolicy,
  });

  bucket.addLifecycleRule({
    enabled: true,
    expiration: Duration.days(30),
    id: 'expire-quarantined-objects',
    prefix: 'quarantine/',
  });

  return bucket;
}
