import type { ListingItem } from '../../types';
import chromium from 'chrome-aws-lambda';
import puppeteer from 'puppeteer-core';

export async function scrapeSubito(query: string): Promise<ListingItem[]> {
  const executablePath = await chromium.executablePath;
  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath,
    headless: chromium.headless,
  });
  const page = await browser.newPage();
  await page.goto(
    \`https://www.subito.it/annunci-italia/vendita/tutto/?q=\${encodeURIComponent(query)}\`,
    { waitUntil: 'networkidle2', timeout: 60000 }
  );
  const items = await page.evaluate(() => {
    const rows = document.querySelectorAll<HTMLAnchorElement>('ul.items-list li > a');
    return Array.from(rows).map(a => ({
      title: a.querySelector('.item-title')?.textContent?.trim() || '',
      price: parseFloat(
        (a.querySelector('.item-price')?.textContent || '')
          .replace(/[^\d,.]/g, '')
          .replace(',', '.')
      ),
      url: a.href
    }));
  });
  await browser.close();
  return items;
}
