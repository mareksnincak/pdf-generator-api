import { z } from 'zod';

export const generateDocumentFromSfnEventOutputDto = z.object({
  documentId: z.string().min(1),
  s3Key: z.string().min(1),
});

export type GenerateDocumentFromSfnEventOutputDto = z.infer<
  typeof generateDocumentFromSfnEventOutputDto
>;
