import { randomBytes, randomUUID } from 'node:crypto';

import { type GenerateDocumentRequestDto } from '../dtos/request.dto';

export class GenerateDocumentMockFactory {
  create(overrides: Partial<GenerateDocumentRequestDto> = {}): GenerateDocumentRequestDto {
    return {
      templateId: randomUUID(),
      data: {
        name: randomBytes(8).toString('hex'),
      },
      ...overrides,
    };
  }
}
