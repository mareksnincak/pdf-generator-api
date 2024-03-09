import { randomUUID } from 'node:crypto';

import { ErrorMessage } from '../../../enums/error.enum';
import {
  type GenerateDocumentFromSfnEventErrorOutputDto,
  type GenerateDocumentFromSfnEventSuccessOutputDto,
} from '../dtos/sfn-output.dto';
import { DocumentGenerationStatus } from '../enums/status.enum';

export class GenerateDocumentFromSfnEventSuccessOutputMockFactory {
  create(
    overrides: Partial<GenerateDocumentFromSfnEventSuccessOutputDto> = {},
  ): GenerateDocumentFromSfnEventSuccessOutputDto {
    return {
      status: DocumentGenerationStatus.success,
      ref: randomUUID(),
      s3Key: randomUUID(),
      ...overrides,
    };
  }
}

export class GenerateDocumentFromSfnEventErrorOutputMockFactory {
  create(
    overrides: Partial<GenerateDocumentFromSfnEventErrorOutputDto> = {},
  ): GenerateDocumentFromSfnEventErrorOutputDto {
    return {
      status: DocumentGenerationStatus.error,
      ref: randomUUID(),
      message: ErrorMessage.templateNotFound,
      ...overrides,
    };
  }
}
