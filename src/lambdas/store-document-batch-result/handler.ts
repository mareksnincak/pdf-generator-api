import * as documentBatchRepository from '../../db/document-batch/repository';
import {
  type DocumentBatchError,
  type DocumentBatchGeneratedDocument,
} from '../../db/document-batch/type';
import { ErrorFormat } from '../../helpers/error.helper';
import { wrapHandler } from '../../helpers/handler.helper';
import { logger } from '../../helpers/logger.helper';
import { validate } from '../../helpers/validation.helper';
import { DocumentGenerationStatus } from '../generate-document/enums/status.enum';

import {
  type StoreDocumentBatchResultInputDto,
  storeDocumentBatchResultInputDto,
} from './dtos/input.dto';

async function handler(input: StoreDocumentBatchResultInputDto) {
  logger.info('storeDocumentBatchResult.starting');

  const validatedData = validate(input, storeDocumentBatchResultInputDto);
  logger.info(validatedData, 'storeDocumentBatchResult.validatedData');

  const { id, results, status, userId } = validatedData;

  const errors: DocumentBatchError[] = [];
  const generatedDocuments: DocumentBatchGeneratedDocument[] = [];
  for (const result of results) {
    if (result.status === DocumentGenerationStatus.success) {
      generatedDocuments.push({
        ref: result.ref,
        s3Key: result.s3Key,
      });
      continue;
    }

    errors.push({
      message: result.message,
      ref: result.ref,
    });
  }

  await documentBatchRepository.updateById({ id, userId }, { errors, generatedDocuments, status });

  logger.info('storeDocumentBatchResult.success');
}

export const storeDocumentBatchResult = wrapHandler(handler, {
  errorFormat: ErrorFormat.RAW,
  logPrefix: 'storeDocumentBatchResult',
});
