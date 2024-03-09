import { randomBytes, randomUUID } from 'node:crypto';

import { TemplateType } from '../db/template/enum';
import { type TemplateDto } from '../dtos/template.dto';

export class TemplateMockFactory {
  create(overrides: Partial<TemplateDto> = {}): TemplateDto {
    return {
      id: randomUUID(),
      name: randomBytes(8).toString('hex'),
      type: TemplateType.htmlHandlebars,
      ...overrides,
    };
  }
}
