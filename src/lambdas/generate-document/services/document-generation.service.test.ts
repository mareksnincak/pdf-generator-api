import { randomUUID } from 'node:crypto';

import { TemplateEntityMockFactory } from '../../../db/template/mock-factory';
import * as templateRepository from '../../../db/template/repository';

import { generateDocument } from './document-generation.service';
import * as pdfService from './pdf.service';

const templateEntity = new TemplateEntityMockFactory().create();

afterEach(() => {
  jest.clearAllMocks();
});

describe('generateDocument', () => {
  it('should generate document', async () => {
    const userId = randomUUID();
    const data = {
      name: 'Sample Name',
    };

    const generatedPdf = Buffer.from('hello Sample Name');
    jest.spyOn(templateRepository, 'getByIdOrFail').mockResolvedValue(templateEntity);
    jest.spyOn(templateEntity, 'getData').mockResolvedValue(Buffer.from('hello {{name}}'));
    jest.spyOn(pdfService, 'createPdfFromHtml').mockResolvedValue(generatedPdf);

    const result = await generateDocument({
      userId,
      templateId: templateEntity.id,
      data,
    });

    expect(result).toEqual(generatedPdf);
  });
});
