import { RemovalPolicy } from 'aws-cdk-lib';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { type Construct } from 'constructs';

export function createS3Bucket(scope: Construct, stackId: string) {
  return new Bucket(scope, 's3-bucket', {
    enforceSSL: true,
    bucketName: stackId,
    removalPolicy: RemovalPolicy.RETAIN_ON_UPDATE_OR_DELETE,
  });
}
