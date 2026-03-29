import { type RemovalPolicy } from 'aws-cdk-lib';
import { Key } from 'aws-cdk-lib/aws-kms';
import { type Construct } from 'constructs';

export function createKmsKey({
  removalPolicy,
  scope,
  stackId,
}: {
  removalPolicy: RemovalPolicy;
  scope: Construct;
  stackId: string;
}) {
  const kmsKey = new Key(scope, 'kms-key', {
    alias: `alias/${stackId}`,
    removalPolicy,
  });

  return kmsKey;
}
