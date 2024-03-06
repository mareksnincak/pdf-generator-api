import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { isSamePdfFile } from '../../../../tests/common/helpers/pdf.helper';

import { createPdfFromHtml } from './pdf.service';

afterEach(() => {
  jest.resetAllMocks();
});

describe('createPdfFromHtml', () => {
  it('should create pdf document from html string', async () => {
    const mocksPath = join(__dirname, '..', '..', '..', '..', 'tests', 'common', 'mocks');
    const html = await readFile(join(mocksPath, 'document.mock.html'));

    const result = await createPdfFromHtml(html.toString('utf-8'));

    const pdf = await readFile(join(mocksPath, 'document.mock.pdf'));
    expect(await isSamePdfFile(pdf, result)).toEqual(true);
  });
});
