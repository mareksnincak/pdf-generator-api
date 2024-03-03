import { randomBytes, randomUUID } from 'node:crypto';

import { TemplateType } from '../db/template/template.enum';
import { type TemplateResponseDto } from '../dtos/template-response.dto';

export class TemplateResponseMockFactory {
  create(overrides: Partial<TemplateResponseDto> = {}): TemplateResponseDto {
    return {
      id: randomUUID(),
      name: randomBytes(8).toString('hex'),
      type: TemplateType.htmlHandlebars,
      ...overrides,
    };
  }
}
