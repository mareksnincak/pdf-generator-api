import { randomBytes, randomUUID } from 'node:crypto';

import { TemplateEntity } from './entity';
import { TemplateType } from './enum';

export class TemplateEntityMockFactory {
  create(overrides: Partial<TemplateEntity> = {}): TemplateEntity {
    return new TemplateEntity({
      name: randomBytes(8).toString('hex'),
      type: TemplateType.htmlHandlebars,
      s3Key: randomBytes(8).toString('hex'),
      userId: randomUUID(),
      ...overrides,
    });
  }
}
