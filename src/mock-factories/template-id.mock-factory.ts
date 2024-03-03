import { randomUUID } from 'node:crypto';

import { type TemplateIdDto } from '../dtos/template-id.dto';

export class TemplateIdMockFactory {
  create(overrides: Partial<TemplateIdDto> = {}): TemplateIdDto {
    return {
      id: randomUUID(),
      ...overrides,
    };
  }
}
