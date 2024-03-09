import type { Context } from 'aws-lambda';

import * as documentBatchRepository from '../../db/document-batch/repository';
import {
  type DocumentBatchError,
  type DocumentBatchGeneratedDocument,
} from '../../db/document-batch/type';
import { handleError } from '../../helpers/error.helper';
import { logger, setLoggerContext } from '../../helpers/logger.helper';
import { validate } from '../../helpers/validation.helper';
import { DocumentGenerationStatus } from '../generate-document/enums/status.enum';

import {
  type StoreDocumentBatchResultInputDto,
  storeDocumentBatchResultInputDto,
} from './dtos/input.dto';

export async function storeDocumentBatchResult(
  input: StoreDocumentBatchResultInputDto,
  context: Context,
): Promise<void> {
  try {
    setLoggerContext({}, context);
    logger.info('storeDocumentBatchResult.starting');

    const validatedData = validate(input, storeDocumentBatchResultInputDto);
    logger.info(validatedData, 'storeDocumentBatchResult.validatedData');

    const { id, userId, status, results } = validatedData;

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
        ref: result.ref,
        message: result.message,
      });
    }

    await documentBatchRepository.updateById(
      { id, userId },
      { status, errors, generatedDocuments },
    );

    logger.info('storeDocumentBatchResult.success');
  } catch (error) {
    handleError({ error, logPrefix: 'storeDocumentBatchResult' });
    throw error;
  }
}
