import { randomUUID } from 'node:crypto';

import type { PartialDeep } from 'type-fest';

import { type SetDefaultUserPasswordResourceProperties } from '../types/properties.type';

export class SetDefaultUserPasswordResourcePropertiesMockFactory {
  create(
    overrides: PartialDeep<SetDefaultUserPasswordResourceProperties> = {},
  ): SetDefaultUserPasswordResourceProperties {
    return {
      physicalResourceId: randomUUID(),
      ServiceToken: randomUUID(),
      userCredentialsSecretName: randomUUID(),
      userPoolId: randomUUID(),
      ...overrides,
    };
  }
}
