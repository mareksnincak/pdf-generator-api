import parsePdf from 'pdf-parse';

import { logger } from '../../../src/helpers/logger.helper';

export async function isSamePdfFile(file1: Buffer, file2: Buffer) {
  const [pdf1, pdf2] = await Promise.all([parsePdf(file1), parsePdf(file2)]);

  const fieldsToCompare = ['numpages', 'numrender', 'metadata', 'version', 'text'] as const;

  return fieldsToCompare.every((field) => {
    const isSame = pdf1[field] === pdf2[field];
    if (!isSame) {
      logger.warn(
        { field, pdf1Value: pdf1[field], pdf2Value: pdf2[field] },
        'tests.pdfHelper.mismatch',
      );
    }

    return isSame;
  });
}
