import { Duration, type RemovalPolicy } from 'aws-cdk-lib';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { type Construct } from 'constructs';

export function createS3Bucket({
  autoDeleteObjects,
  removalPolicy,
  scope,
}: {
  autoDeleteObjects: boolean;
  removalPolicy: RemovalPolicy;
  scope: Construct;
}) {
  const bucket = new Bucket(scope, 's3-bucket', {
    autoDeleteObjects,
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
