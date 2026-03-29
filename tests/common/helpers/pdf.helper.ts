import { PDFParse } from 'pdf-parse';

async function parsePdf(buffer: Uint8Array) {
  const parser = new PDFParse({
    /**
     * Cloning the buffer no not modify original buffer as PDFParse
     * would otherwise clear the source buffer
     */
    data: Buffer.from(buffer),
  });

  const { text, total } = await parser.getText({ parsePageInfo: true });

  await parser.destroy();

  return { numberOfPages: total, text };
}

export async function isSamePdfFile(file1: Uint8Array, file2: Uint8Array) {
  const [pdf1, pdf2] = await Promise.all([parsePdf(file1), parsePdf(file2)]);

  return pdf1.numberOfPages === pdf2.numberOfPages && pdf1.text === pdf2.text;
}
