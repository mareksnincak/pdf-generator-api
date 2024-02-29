import { randomUUID } from 'node:crypto';

import { type DeleteTemplateRequestDto } from '../dtos/request.dto';

export class DeleteTemplateRequestMockFactory {
  create(overrides: Partial<DeleteTemplateRequestDto> = {}): DeleteTemplateRequestDto {
    return {
      id: randomUUID(),
      ...overrides,
    };
  }
}
