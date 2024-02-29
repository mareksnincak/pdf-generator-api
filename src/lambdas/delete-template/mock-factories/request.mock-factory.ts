import { randomBytes, randomUUID } from 'node:crypto';

import { type DeleteTemplateRequestDto } from '../dtos/request.dto';
import { TemplateType } from '../../../db/template/template.enum';

export class CreateTemplateRequestMockFactory {
  create(overrides: Partial<DeleteTemplateRequestDto> = {}): DeleteTemplateRequestDto {
    return {
      name: randomBytes(8).toString('hex'),
      uploadId: randomUUID(),
      type: TemplateType.htmlHandlebars,
      ...overrides,
    };
  }

  createRaw(overrides: Partial<DeleteTemplateRequestDto> = {}): string {
    return JSON.stringify(this.create(overrides));
  }
}
