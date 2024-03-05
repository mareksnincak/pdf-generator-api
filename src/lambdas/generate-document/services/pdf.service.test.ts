import { createPdfFromHtml } from './pdf.service';

afterEach(() => {
  jest.resetAllMocks();
});

describe('createPdfFromHtml', () => {
  it('should create pdf document from html string', async () => {
    const html = 'hello world';

    const result = await createPdfFromHtml(html);

    expect(result).toEqual(expect.any(Buffer)); // TODO compare with mock
  });
});
