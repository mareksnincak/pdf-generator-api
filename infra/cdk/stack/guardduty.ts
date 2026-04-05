import { Rule } from 'aws-cdk-lib/aws-events';
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets';
import { CfnMalwareProtectionPlan } from 'aws-cdk-lib/aws-guardduty';
import { PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { type NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { type Bucket } from 'aws-cdk-lib/aws-s3';
import { type Construct } from 'constructs';

import { createSqsQueues } from './sqs';

export function createGuardDutyMalwareProtection({
  account,
  processMalwareScanResultLambda,
  region,
  s3Bucket,
  scope,
  sqsQueues,
}: {
  account: string;
  processMalwareScanResultLambda: NodejsFunction;
  region: string;
  s3Bucket: Bucket;
  scope: Construct;
  sqsQueues: ReturnType<typeof createSqsQueues>;
}) {
  const guardDutyRole = new Role(scope, 'guardduty-malware-protection-role', {
    assumedBy: new ServicePrincipal('malware-protection-plan.guardduty.amazonaws.com'),
  });

  const guardDutyManagedRuleArn = `arn:aws:events:${region}:${account}:rule/DO-NOT-DELETE-AmazonGuardDutyMalwareProtectionS3*`;

  guardDutyRole.addToPolicy(
    new PolicyStatement({
      actions: ['events:PutRule', 'events:DeleteRule', 'events:PutTargets', 'events:RemoveTargets'],
      conditions: {
        StringLike: {
          'events:ManagedBy': 'malware-protection-plan.guardduty.amazonaws.com',
        },
      },
      resources: [guardDutyManagedRuleArn],
      sid: 'AllowManagedRuleToSendS3EventsToGuardDuty',
    }),
  );

  guardDutyRole.addToPolicy(
    new PolicyStatement({
      actions: ['events:DescribeRule', 'events:ListTargetsByRule'],
      resources: [guardDutyManagedRuleArn],
      sid: 'AllowGuardDutyToMonitorEventBridgeManagedRule',
    }),
  );

  guardDutyRole.addToPolicy(
    new PolicyStatement({
      actions: [
        's3:PutObjectTagging',
        's3:GetObjectTagging',
        's3:PutObjectVersionTagging',
        's3:GetObjectVersionTagging',
      ],
      resources: [`${s3Bucket.bucketArn}/templates/data/*`],
      sid: 'AllowPostScanTag',
    }),
  );

  guardDutyRole.addToPolicy(
    new PolicyStatement({
      actions: ['s3:PutBucketNotification', 's3:GetBucketNotification'],
      resources: [s3Bucket.bucketArn],
      sid: 'AllowEnableS3EventBridgeEvents',
    }),
  );

  guardDutyRole.addToPolicy(
    new PolicyStatement({
      actions: ['s3:PutObject'],
      resources: [`${s3Bucket.bucketArn}/malware-protection-resource-validation-object`],
      sid: 'AllowPutValidationObject',
    }),
  );

  guardDutyRole.addToPolicy(
    new PolicyStatement({
      actions: ['s3:ListBucket'],
      resources: [s3Bucket.bucketArn],
      sid: 'AllowCheckBucketOwnership',
    }),
  );

  guardDutyRole.addToPolicy(
    new PolicyStatement({
      actions: ['s3:GetObject', 's3:GetObjectVersion'],
      resources: [`${s3Bucket.bucketArn}/templates/data/*`],
      sid: 'AllowMalwareScan',
    }),
  );

  const malwareProtectionPlan = new CfnMalwareProtectionPlan(scope, 'malware-protection-plan', {
    actions: {
      tagging: {
        status: 'ENABLED',
      },
    },
    protectedResource: {
      s3Bucket: {
        bucketName: s3Bucket.bucketName,
        objectPrefixes: ['templates/data/'],
      },
    },
    role: guardDutyRole.roleArn,
  });

  /*
   * GuardDuty validates the role's permissions when creating the plan. Without this,
   * CloudFormation only waits for the Role before creating the plan — the DefaultPolicy
   * (AWS::IAM::Policy with all addToPolicy statements) is a separate resource that may
   * not be attached yet, causing validation failures on fresh deploys.
   */
  malwareProtectionPlan.node.addDependency(guardDutyRole.node.findChild('DefaultPolicy'));

  new Rule(scope, 'malware-scan-result-rule', {
    eventPattern: {
      detailType: ['GuardDuty Malware Protection Object Scan Result'],
      source: ['aws.guardduty'],
    },
    targets: [
      new LambdaFunction(processMalwareScanResultLambda, {
        deadLetterQueue: sqsQueues.deadLetterQueue,
        retryAttempts: 3,
      }),
    ],
  });
}
