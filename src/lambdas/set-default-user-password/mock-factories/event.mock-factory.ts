import { randomUUID } from 'node:crypto';

import { type CloudFormationCustomResourceEvent } from 'aws-lambda';

import { SetDefaultUserPasswordResourcePropertiesMockFactory } from './event-resource-properties.mock-factory';

export class CloudFormationCustomResourceEventMockFactory {
  create(
    overrides: Partial<CloudFormationCustomResourceEvent> = {},
  ): CloudFormationCustomResourceEvent {
    return {
      LogicalResourceId: randomUUID(),
      RequestId: randomUUID(),
      RequestType: 'Create',
      ResourceProperties: new SetDefaultUserPasswordResourcePropertiesMockFactory().create(
        overrides.ResourceProperties,
      ),
      StackId: randomUUID(),
      ...overrides,
    } satisfies Partial<CloudFormationCustomResourceEvent> as CloudFormationCustomResourceEvent;
  }
}
