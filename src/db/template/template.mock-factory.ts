import { randomBytes, randomUUID } from 'node:crypto';

import { TemplateEntity } from './template.entity';
import { TemplateType } from './template.enum';

export class TemplateEntityMockFactory {
  create(overrides: Partial<TemplateEntity> = {}): TemplateEntity {
    return new TemplateEntity({
      id: randomUUID(),
      name: randomBytes(8).toString('hex'),
      type: TemplateType.htmlHandlebars,
      s3Key: randomBytes(8).toString('hex'),
      userId: randomUUID(),
      createdAt: new Date(),
      ...overrides,
    });
  }
}
