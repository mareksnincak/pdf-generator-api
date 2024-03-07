/* eslint-disable @typescript-eslint/indent */
// TODO handle eslint bug
import { randomUUID } from 'node:crypto';

import { type PartialDeep } from 'type-fest';

import { GenerateDocumentFromApiGwEventRequestMockFactory } from '../../generate-document/mock-factories/api-request.mock-factory';
import {
  type StartDocumentBatchGenerationDocumentRequestDto,
  type StartDocumentBatchGenerationRequestDto,
} from '../dtos/request.dto';

export class StartDocumentBatchGenerationDocumentRequestMockFactory extends GenerateDocumentFromApiGwEventRequestMockFactory {
  create(
    overrides: Partial<StartDocumentBatchGenerationDocumentRequestDto> = {},
  ): StartDocumentBatchGenerationDocumentRequestDto {
    return {
      ...super.create(),
      ref: randomUUID(),
      ...overrides,
    };
  }
}

export class StartDocumentBatchGenerationRequestMockFactory {
  create(
    overrides: PartialDeep<
      StartDocumentBatchGenerationRequestDto,
      { recurseIntoArrays: true }
    > = {},
  ): StartDocumentBatchGenerationRequestDto {
    const documentFactory = new StartDocumentBatchGenerationDocumentRequestMockFactory();
    let documents: StartDocumentBatchGenerationDocumentRequestDto[] = [documentFactory.create()];

    if (overrides.documents) {
      documents = overrides.documents.map((override) => documentFactory.create(override));
    }

    return {
      ...overrides,
      documents,
    } satisfies PartialDeep<
      StartDocumentBatchGenerationRequestDto,
      { recurseIntoArrays: true }
    > as StartDocumentBatchGenerationRequestDto;
  }
}
