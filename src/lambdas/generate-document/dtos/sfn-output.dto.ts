import { z } from 'zod';

import { DocumentGenerationStatus } from '../enums/status.enum';

export const generateDocumentFromSfnSuccessEventOutputDto = z.object({
  status: z.literal(DocumentGenerationStatus.success),
  ref: z.string().min(1),
  s3Key: z.string().min(1),
});

export const generateDocumentFromSfnFailureEventOutputDto = z.object({
  status: z.literal(DocumentGenerationStatus.failure),
  ref: z.string().min(1).nullable(),
  message: z.string().min(1),
});

export const generateDocumentFromSfnEventOutputDto =
  generateDocumentFromSfnSuccessEventOutputDto.or(generateDocumentFromSfnFailureEventOutputDto);

export type GenerateDocumentFromSfnSuccessEventOutputDto = z.infer<
  typeof generateDocumentFromSfnSuccessEventOutputDto
>;

export type GenerateDocumentFromSfnErrorEventOutputDto = z.infer<
  typeof generateDocumentFromSfnFailureEventOutputDto
>;

export type GenerateDocumentFromSfnEventOutputDto = z.infer<
  typeof generateDocumentFromSfnEventOutputDto
>;
