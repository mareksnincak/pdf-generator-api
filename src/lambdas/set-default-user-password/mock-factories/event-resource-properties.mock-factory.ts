import { randomUUID } from 'node:crypto';

import { type SetDefaultUserPasswordResourceProperties } from '../types/properties.type';

export class SetDefaultUserPasswordResourcePropertiesMockFactory {
  create(
    overrides: Partial<SetDefaultUserPasswordResourceProperties> = {},
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
