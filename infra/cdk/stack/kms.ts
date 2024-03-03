import { type RemovalPolicy } from 'aws-cdk-lib';
import { Key } from 'aws-cdk-lib/aws-kms';
import { type Construct } from 'constructs';

export function createKmsKey({
  scope,
  stackId,
  removalPolicy,
}: {
  scope: Construct;
  stackId: string;
  removalPolicy: RemovalPolicy;
}) {
  const kmsKey = new Key(scope, 'kms-key', {
    alias: `alias/${stackId}`,
    removalPolicy,
  });

  return kmsKey;
}
