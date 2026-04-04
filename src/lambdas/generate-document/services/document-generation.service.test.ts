import { randomUUID } from 'node:crypto';

import { MalwareScanStatus } from '../../../db/template/enum';
import { TemplateEntityMockFactory } from '../../../db/template/mock-factory';
import * as templateRepository from '../../../db/template/repository';
import { ErrorMessage } from '../../../enums/error.enum';

import { generateDocument } from './document-generation.service';
import * as pdfService from './pdf.service';

const templateEntityMockFactory = new TemplateEntityMockFactory();

afterEach(() => {
  jest.clearAllMocks();
});

describe('generateDocument', () => {
  it('should generate document', async () => {
    const userId = randomUUID();
    const data = {
      name: 'Sample Name',
    };

    const templateEntity = templateEntityMockFactory.create();
    const generatedPdf = Buffer.from('hello Sample Name');
    jest.spyOn(templateRepository, 'getByIdOrFail').mockResolvedValue(templateEntity);
    jest.spyOn(templateEntity, 'getData').mockResolvedValue(Buffer.from('hello {{name}}'));
    jest.spyOn(pdfService, 'createPdfFromHtml').mockResolvedValue(generatedPdf);

    const result = await generateDocument({
      data,
      templateId: templateEntity.id,
      userId,
    });

    expect(result).toEqual(generatedPdf);
  });

  it('should throw error when malwareScanStatus is infected', async () => {
    const templateEntity = templateEntityMockFactory.create({
      malwareScanStatus: MalwareScanStatus.infected,
    });
    jest.spyOn(templateRepository, 'getByIdOrFail').mockResolvedValue(templateEntity);

    await expect(
      generateDocument({ data: {}, templateId: templateEntity.id, userId: randomUUID() }),
    ).rejects.toMatchObject({ message: ErrorMessage.templateInfected });
  });
});
