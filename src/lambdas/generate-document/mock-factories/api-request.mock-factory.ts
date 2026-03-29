import { randomBytes, randomUUID } from 'node:crypto';

import { type GenerateDocumentFromApiEventRequestDto } from '../dtos/api-request.dto';

export class GenerateDocumentFromApiEventRequestMockFactory {
  create(
    overrides: Partial<GenerateDocumentFromApiEventRequestDto> = {},
  ): GenerateDocumentFromApiEventRequestDto {
    return {
      data: {
        name: randomBytes(8).toString('hex'),
      },
      templateId: randomUUID(),
      ...overrides,
    };
  }
}
