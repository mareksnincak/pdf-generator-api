import { join } from 'node:path';

import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';

import { logger } from '../../../helpers/logger.helper';
import robotoFont from '../fonts/roboto-regular.ttf';

chromium.setHeadlessMode = true;
chromium.setGraphicsMode = false;

let executablePath: string | undefined;

async function getExecutablePath() {
  if (executablePath) {
    return executablePath;
  }

  executablePath = await chromium.executablePath();
  return executablePath;
}

export async function transformPdfToHtml(html: string) {
  logger.info('generateDocument.pdfTransformer.transformPdfToHtml.start');

  await chromium.font(join('/var', 'task', robotoFont));

  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await getExecutablePath(),
    headless: true,
  });

  logger.debug('generateDocument.pdfTransformer.transformPdfToHtml.initialized');

  const page = await browser.newPage();
  await Promise.all([page.setOfflineMode(true), page.setJavaScriptEnabled(false)]);

  await page.setContent(html);
  const pdf = await page.pdf({
    format: 'A4',
  });

  await browser.close();

  logger.info('generateDocument.pdfTransformer.transformPdfToHtml.success');
  return pdf;
}
