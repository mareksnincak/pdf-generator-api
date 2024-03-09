import { randomBytes } from 'node:crypto';

import { type TemplateWithDataUrlDto } from '../../../dtos/template-with-data-response.dto';
import { TemplateMockFactory } from '../../../mock-factories/template.mock-factory';

export class GetTemplatesResponseMockFactory extends TemplateMockFactory {
  create(overrides: Partial<TemplateWithDataUrlDto> = {}): TemplateWithDataUrlDto {
    return {
      ...super.create(),
      dataUrl: randomBytes(8).toString('hex'),
      ...overrides,
    };
  }
}
