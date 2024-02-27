import { randomBytes, randomUUID } from 'node:crypto';

import { type CreateTemplateRequestDto } from '../dtos/create-template-request.dto';
import { TemplateType } from '../../../db/template/template.enum';

export class CreateTemplateRequestMockFactory {
  create(overrides: Partial<CreateTemplateRequestDto> = {}): CreateTemplateRequestDto {
    return {
      name: randomBytes(8).toString('hex'),
      uploadId: randomUUID(),
      type: TemplateType.htmlHandlebars,
      ...overrides,
    };
  }

  createRaw(overrides: Partial<CreateTemplateRequestDto> = {}): string {
    return JSON.stringify(this.create(overrides));
  }
}
