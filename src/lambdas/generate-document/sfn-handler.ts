import { randomUUID } from 'node:crypto';

import type { Context } from 'aws-lambda';

import { getEnvVariableOrFail } from '../../helpers/env.helper';
import { logger, setLoggerContext } from '../../helpers/logger.helper';
import { putObject } from '../../helpers/s3.helper';
import { validate } from '../../helpers/validation.helper';

import {
  generateDocumentFromSfnEventInputDto,
  type GenerateDocumentFromSfnEventInputDto,
} from './dtos/sfn-input.dto';
import { type GenerateDocumentFromSfnEventOutputDto } from './dtos/sfn-output.dto';
import { generateDocument } from './services/document-generation.service';

export async function generateDocumentFromSfnEvent(
  input: GenerateDocumentFromSfnEventInputDto,
  context: Context,
): Promise<GenerateDocumentFromSfnEventOutputDto> {
  try {
    setLoggerContext({}, context);
    logger.info('generateDocumentFromSfnEvent.input');

    const validatedData = validate(input, generateDocumentFromSfnEventInputDto);
    logger.info(validatedData, 'generateDocumentFromSfnEvent.validatedData');

    const bucket = getEnvVariableOrFail('S3_BUCKET');
    const { templateId, data, userId } = validatedData;

    const pdf = await generateDocument({ userId, templateId, data });

    const documentId = randomUUID();
    const s3Key = `${userId}/documents/${documentId}`;
    await putObject({
      bucket,
      key: s3Key,
      data: pdf,
    });

    const output: GenerateDocumentFromSfnEventOutputDto = {
      documentId,
      s3Key,
    };
    logger.info(output, 'generateDocumentFromSfnEvent.success');
    return output;
  } catch (error) {
    logger.error(error, 'generateDocumentFromSfnEvent.error');
    throw error;
  }
}
