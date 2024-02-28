import { Bucket } from 'aws-cdk-lib/aws-s3';
import { type Construct } from 'constructs';

export function createS3Bucket(scope: Construct, id: string) {
  return new Bucket(scope, 's3-bucket', {
    enforceSSL: true,
    bucketName: id,
  });
}
