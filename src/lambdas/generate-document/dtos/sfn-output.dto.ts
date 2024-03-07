import { z } from 'zod';

export const generateDocumentFromSfnSuccessEventOutputDto = z.object({
  ref: z.string().min(1),
  s3Key: z.string().min(1),
});

export const generateDocumentFromSfnFailureEventOutputDto = z.object({
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
