import { randomBytes, randomUUID } from 'node:crypto';

import { TemplateEntity } from './entity';
import { MalwareScanStatus, TemplateType } from './enum';

export class TemplateEntityMockFactory {
  create(overrides: Partial<TemplateEntity> = {}): TemplateEntity {
    return new TemplateEntity({
      malwareScanStatus: MalwareScanStatus.clean,
      name: randomBytes(8).toString('hex'),
      s3Key: randomBytes(8).toString('hex'),
      type: TemplateType.htmlHandlebars,
      userId: randomUUID(),
      ...overrides,
    });
  }
}
