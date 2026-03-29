import { z } from 'zod';

import { DocumentGenerationStatus } from '../enums/status.enum';

export const generateDocumentFromSfnEventSuccessOutputDto = z.object({
  ref: z.string().min(1),
  s3Key: z.string().min(1),
  status: z.literal(DocumentGenerationStatus.success),
});

export const generateDocumentFromSfnEventErrorOutputDto = z.object({
  message: z.string().min(1),
  ref: z.string().min(1).nullable(),
  status: z.literal(DocumentGenerationStatus.error),
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
