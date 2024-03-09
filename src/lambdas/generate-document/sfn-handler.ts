import { randomUUID } from 'node:crypto';

import type { Context } from 'aws-lambda';

import { getEnvVariableOrFail } from '../../helpers/env.helper';
import { handleError } from '../../helpers/error.helper';
import { logger, setLoggerContext } from '../../helpers/logger.helper';
import { putObject } from '../../helpers/s3.helper';
import { validate } from '../../helpers/validation.helper';

import {
  generateDocumentFromSfnEventInputDto,
  type GenerateDocumentFromSfnEventInputDto,
} from './dtos/sfn-input.dto';
import {
  type GenerateDocumentFromSfnEventOutputDto,
  type GenerateDocumentFromSfnEventErrorOutputDto,
  type GenerateDocumentFromSfnEventSuccessOutputDto,
} from './dtos/sfn-output.dto';
import { DocumentGenerationStatus } from './enums/status.enum';
import { generateDocument } from './services/document-generation.service';

export async function generateDocumentFromSfnEvent(
  input: GenerateDocumentFromSfnEventInputDto,
  context: Context,
): Promise<GenerateDocumentFromSfnEventOutputDto> {
  let documentRef: string | null = null;
  try {
    setLoggerContext({}, context);
    logger.info('generateDocumentFromSfnEvent.input');

    const validatedData = validate(input, generateDocumentFromSfnEventInputDto);
    logger.info(validatedData, 'generateDocumentFromSfnEvent.validatedData');
    const { templateId, data, userId, ref } = validatedData;
    documentRef = ref;

    const bucket = getEnvVariableOrFail('S3_BUCKET');

    const pdf = await generateDocument({ userId, templateId, data });

    const documentId = randomUUID();
    const s3Key = `${userId}/documents/${documentId}.pdf`;
    await putObject({
      bucket,
      key: s3Key,
      data: pdf,
    });

    const output: GenerateDocumentFromSfnEventSuccessOutputDto = {
      status: DocumentGenerationStatus.success,
      ref,
      s3Key,
    };
    logger.info(output, 'generateDocumentFromSfnEvent.successOutput');
    return output;
  } catch (error) {
    const { response } = handleError({ error, logPrefix: 'generateDocumentFromSfnEvent' });

    const output: GenerateDocumentFromSfnEventErrorOutputDto = {
      status: DocumentGenerationStatus.error,
      ref: documentRef,
      message: response.message,
    };

    logger.info(output, 'generateDocumentFromSfnEvent.errorOutput');
    return output;
  }
}
