import { z } from 'zod';

import { generateDocumentFromApiEventRequestDto } from './api-request.dto';

export const generateDocumentFromSfnEventInputDto = generateDocumentFromApiEventRequestDto.extend({
  ref: z.string().min(1),
  userId: z.string().min(1),
});

export type GenerateDocumentFromSfnEventInputDto = z.infer<
  typeof generateDocumentFromSfnEventInputDto
>;
