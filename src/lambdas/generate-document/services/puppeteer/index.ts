import chromium from '@sparticuz/chromium';
import { launch as launchPuppeteer } from 'puppeteer-core';

import { logger } from '../../../../helpers/logger.helper';

export async function transformPdfToHtml(html: string) {
  const browser = await launchPuppeteer({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath(),
    headless: 'shell',
  });

  logger.debug('puppeteerService.transformPdfToHtml.initialized');

  const page = await browser.newPage();
  await page.setContent(html);
  const pdf = await page.pdf({
    format: 'A4',
  });

  await browser.close();

  logger.info('puppeteerService.transformPdfToHtml.success');
  return pdf;
}
