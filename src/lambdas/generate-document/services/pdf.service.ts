import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';

import { logger } from '../../../helpers/logger.helper';

chromium.setHeadlessMode = true;
chromium.setGraphicsMode = false;

let executablePath: string | undefined;

async function getExecutablePath() {
  if (executablePath) {
    return executablePath;
  }

  executablePath = process.env.CHROMIUM_LOCAL_EXECUTABLE_PATH;
  if (!executablePath) {
    executablePath = await chromium.executablePath();
  }

  return executablePath;
}

export async function createPdfFromHtml(html: string) {
  logger.info('generateDocument.pdfService.createPdfFromHtml.start');

  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await getExecutablePath(),
    headless: true,
  });

  logger.debug('generateDocument.pdfService.createPdfFromHtml.initialized');

  const page = await browser.newPage();
  await Promise.all([page.setOfflineMode(true), page.setJavaScriptEnabled(false)]);

  await page.setContent(html);
  const pdf = await page.pdf({
    format: 'A4',
  });

  await browser.close();

  logger.info('generateDocument.pdfService.createPdfFromHtml.success');
  return pdf;
}
