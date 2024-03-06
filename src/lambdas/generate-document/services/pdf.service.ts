import chromium from '@sparticuz/chromium';
import puppeteer, { type PuppeteerLaunchOptions } from 'puppeteer-core';

import { logger } from '../../../helpers/logger.helper';

chromium.setHeadlessMode = true;
chromium.setGraphicsMode = false;

let launchOptions: PuppeteerLaunchOptions | undefined;

async function getLaunchOptions() {
  if (launchOptions) {
    return launchOptions;
  }

  const defaultArgs = chromium.args;
  const defaultLaunchOptions: PuppeteerLaunchOptions = {
    args: defaultArgs,
    defaultViewport: chromium.defaultViewport,
    headless: true,
    executablePath: await chromium.executablePath(),
  };

  const chromiumLocalExecutablePath = process.env.CHROMIUM_LOCAL_EXECUTABLE_PATH;
  if (chromiumLocalExecutablePath) {
    defaultLaunchOptions.executablePath = chromiumLocalExecutablePath;
    defaultLaunchOptions.args = [...defaultArgs, '--no-sandbox', '--disable-setuid-sandbox'];
  }

  launchOptions = defaultLaunchOptions;
  return launchOptions;
}

export async function createPdfFromHtml(html: string) {
  logger.info('generateDocument.pdfService.createPdfFromHtml.start');

  const browser = await puppeteer.launch(await getLaunchOptions());

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
