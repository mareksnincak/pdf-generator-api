import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';

import { logger } from '../../../../helpers/logger.helper';

export async function transformPdfToHtml(html: string) {
  chromium.setHeadlessMode = true;
  chromium.setGraphicsMode = false;

  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath(),
    headless: true,
  });

  logger.debug('puppeteerService.transformPdfToHtml.initialized');

  const page = await browser.newPage();
  await Promise.all([page.setOfflineMode(true), page.setJavaScriptEnabled(false)]);

  await page.setContent(html);
  const pdf = await page.pdf({
    format: 'A4',
  });

  await browser.close();

  logger.info('puppeteerService.transformPdfToHtml.success');
  return pdf;
}
