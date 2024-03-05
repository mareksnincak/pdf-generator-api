import chromium from '@sparticuz/chromium';
import { launch as launchPuppeteer } from 'puppeteer-core';

import { logger } from '../../../../helpers/logger.helper';

export async function transformPdfToHtml(html: string) {
  // Will be implemented in next MR

  const browser = await launchPuppeteer({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath(),
    headless: 'shell',
  });

  logger.debug('puppeteerService.transformPdfToHtml.initialized');

  const page = await browser.newPage();
  await page.goto('https://example.com');
  const pageTitle = await page.title();

  await browser.close();

  logger.info({ pageTitle }, 'puppeteerService.transformPdfToHtml.success');
  return await Promise.resolve(Buffer.from(html));
}
