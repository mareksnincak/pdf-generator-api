import { randomUUID } from 'node:crypto';

import { DocumentBatchStatus } from '../../../db/document-batch/enum';
import { type GenerateDocumentFromSfnEventOutputDto } from '../../generate-document/dtos/sfn-output.dto';
import { DocumentGenerationStatus } from '../../generate-document/enums/status.enum';
import {
  GenerateDocumentFromSfnEventErrorOutputMockFactory,
  GenerateDocumentFromSfnEventSuccessOutputMockFactory,
} from '../../generate-document/mock-factories/sfn-output.mock-factory';
import { type StoreDocumentBatchResultInputDto } from '../dtos/input.dto';

export class StoreDocumentBatchResultInputMockFactory {
  create(
    overrides: Partial<StoreDocumentBatchResultInputDto> = {},
  ): StoreDocumentBatchResultInputDto {
    const successResultFactory = new GenerateDocumentFromSfnEventSuccessOutputMockFactory();
    const errorResultFactory = new GenerateDocumentFromSfnEventErrorOutputMockFactory();

    let results: GenerateDocumentFromSfnEventOutputDto[] = [successResultFactory.create()];
    if (overrides.results) {
      results = overrides.results.map((override) => {
        if (override.status === DocumentGenerationStatus.error) {
          return errorResultFactory.create(override);
        }

        return successResultFactory.create(override);
      });
    }

    return {
      id: randomUUID(),
      userId: randomUUID(),
      status: DocumentBatchStatus.completed,
      results,
      ...overrides,
    };
  }
}
