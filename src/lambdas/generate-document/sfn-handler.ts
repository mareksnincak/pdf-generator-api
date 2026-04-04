import { randomUUID } from 'node:crypto';

import { getEnvVariableOrFail } from '../../helpers/env.helper';
import { ErrorFormat, handleError } from '../../helpers/error.helper';
import { wrapHandler } from '../../helpers/handler.helper';
import { logger } from '../../helpers/logger.helper';
import { putObject } from '../../helpers/s3.helper';
import { validate } from '../../helpers/validation.helper';

import {
  generateDocumentFromSfnEventInputDto,
  type GenerateDocumentFromSfnEventInputDto,
} from './dtos/sfn-input.dto';
import {
  type GenerateDocumentFromSfnEventErrorOutputDto,
  type GenerateDocumentFromSfnEventOutputDto,
  type GenerateDocumentFromSfnEventSuccessOutputDto,
} from './dtos/sfn-output.dto';
import { DocumentGenerationStatus } from './enums/status.enum';
import { generateDocument } from './services/document-generation.service';

async function handler(
  input: GenerateDocumentFromSfnEventInputDto,
): Promise<GenerateDocumentFromSfnEventOutputDto> {
  let documentRef: null | string = null;
  try {
    logger.info('generateDocumentFromSfnEvent.input');

    const validatedData = validate(input, generateDocumentFromSfnEventInputDto);
    logger.info(validatedData, 'generateDocumentFromSfnEvent.validatedData');
    const { data, ref, templateId, userId } = validatedData;
    documentRef = ref;

    const bucket = getEnvVariableOrFail('S3_BUCKET');

    const pdf = await generateDocument({ data, templateId, userId });

    const documentId = randomUUID();
    const s3Key = `documents/${userId}/${documentId}.pdf`;
    await putObject({
      bucket,
      data: pdf,
      key: s3Key,
    });

    const output: GenerateDocumentFromSfnEventSuccessOutputDto = {
      ref,
      s3Key,
      status: DocumentGenerationStatus.success,
    };
    logger.info(output, 'generateDocumentFromSfnEvent.successOutput');
    return output;
  } catch (error) {
    const { response } = handleError({
      error,
      format: ErrorFormat.RAW,
      logPrefix: 'generateDocumentFromSfnEvent',
    });

    const output: GenerateDocumentFromSfnEventErrorOutputDto = {
      message: response.message,
      ref: documentRef,
      status: DocumentGenerationStatus.error,
    };

    logger.info(output, 'generateDocumentFromSfnEvent.errorOutput');
    return output;
  }
}

export const generateDocumentFromSfnEvent = wrapHandler(handler, {
  errorFormat: ErrorFormat.RAW,
  logPrefix: 'generateDocumentFromSfnEvent',
});
