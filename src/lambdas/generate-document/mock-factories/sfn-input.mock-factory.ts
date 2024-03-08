import { randomUUID } from 'node:crypto';

import { type GenerateDocumentFromSfnEventInputDto } from '../dtos/sfn-input.dto';

import { GenerateDocumentFromApiEventRequestMockFactory } from './api-request.mock-factory';

export class GenerateDocumentFromSfnEventInputMockFactory extends GenerateDocumentFromApiEventRequestMockFactory {
  create(
    overrides: Partial<GenerateDocumentFromSfnEventInputDto> = {},
  ): GenerateDocumentFromSfnEventInputDto {
    return {
      ...super.create(),
      ref: randomUUID(),
      userId: randomUUID(),
      ...overrides,
    };
  }
}
