import { randomBytes, randomUUID } from 'node:crypto';

import { type GenerateDocumentFromApiEventRequestDto } from '../dtos/api-request.dto';

export class GenerateDocumentFromApiGwEventRequestMockFactory {
  create(
    overrides: Partial<GenerateDocumentFromApiEventRequestDto> = {},
  ): GenerateDocumentFromApiEventRequestDto {
    return {
      templateId: randomUUID(),
      data: {
        name: randomBytes(8).toString('hex'),
      },
      ...overrides,
    };
  }
}
