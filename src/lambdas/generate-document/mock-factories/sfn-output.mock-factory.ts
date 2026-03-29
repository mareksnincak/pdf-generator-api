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
      ref: randomUUID(),
      s3Key: randomUUID(),
      status: DocumentGenerationStatus.success,
      ...overrides,
    };
  }
}

export class GenerateDocumentFromSfnEventErrorOutputMockFactory {
  create(
    overrides: Partial<GenerateDocumentFromSfnEventErrorOutputDto> = {},
  ): GenerateDocumentFromSfnEventErrorOutputDto {
    return {
      message: ErrorMessage.templateNotFound,
      ref: randomUUID(),
      status: DocumentGenerationStatus.error,
      ...overrides,
    };
  }
}
