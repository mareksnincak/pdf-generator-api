import { randomBytes } from 'node:crypto';

import { type TemplateWithDataResponseDto } from '../dtos/template-with-data-response.dto';

import { TemplateResponseMockFactory } from './template-response.mock-factory';

export class TemplateWithDataResponseMockFactory extends TemplateResponseMockFactory {
  create(overrides: Partial<TemplateWithDataResponseDto> = {}): TemplateWithDataResponseDto {
    return {
      ...super.create(),
      dataUrl: randomBytes(8).toString('hex'),
      ...overrides,
    };
  }
}
