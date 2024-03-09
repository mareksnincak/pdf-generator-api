import { z } from 'zod';

import { DocumentGenerationStatus } from '../enums/status.enum';

export const generateDocumentFromSfnEventSuccessOutputDto = z.object({
  status: z.literal(DocumentGenerationStatus.success),
  ref: z.string().min(1),
  s3Key: z.string().min(1),
});

export const generateDocumentFromSfnEventErrorOutputDto = z.object({
  status: z.literal(DocumentGenerationStatus.error),
  ref: z.string().min(1).nullable(),
  message: z.string().min(1),
});

export const generateDocumentFromSfnEventOutputDto =
  generateDocumentFromSfnEventSuccessOutputDto.or(generateDocumentFromSfnEventErrorOutputDto);

export type GenerateDocumentFromSfnEventSuccessOutputDto = z.infer<
  typeof generateDocumentFromSfnEventSuccessOutputDto
>;

export type GenerateDocumentFromSfnEventErrorOutputDto = z.infer<
  typeof generateDocumentFromSfnEventErrorOutputDto
>;

export type GenerateDocumentFromSfnEventOutputDto = z.infer<
  typeof generateDocumentFromSfnEventOutputDto
>;
