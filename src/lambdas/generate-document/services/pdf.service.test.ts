import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { documentMockName } from '../../../../tests/common/constants/document.constant';
import { isSamePdfFile } from '../../../../tests/common/helpers/pdf.helper';

import { createPdfFromHtml } from './pdf.service';

afterEach(() => {
  jest.resetAllMocks();
});

describe('createPdfFromHtml', () => {
  it('should create pdf document from html string', async () => {
    const mocksPath = join(__dirname, '..', '..', '..', '..', 'tests', 'common', 'mocks');
    const htmlTemplate = await readFile(join(mocksPath, 'document.mock.html'));
    const html = htmlTemplate.toString('utf-8').replace('{{name}}', documentMockName);

    const result = await createPdfFromHtml(html);

    const pdf = await readFile(join(mocksPath, 'document.mock.pdf'));
    expect(await isSamePdfFile(pdf, result)).toEqual(true);
  });
});
