import chromium from 'chrome-aws-lambda';
import puppeteer from 'puppeteer-core';
import { load } from 'cheerio';
import type { ListingItem } from '../../types';

export async function scrapeSubito(query: string): Promise<ListingItem[]> {
  const executablePath = await chromium.executablePath;
  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath,
    headless: chromium.headless,
  });
  const page = await browser.newPage();

  // Qui il back-tick è fondamentale: senza di esso url non viene popolato
  const url = \`https://www.subito.it/annunci-italia/vendita/tutto/?q=\${encodeURIComponent(query)}\`;
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

  const html = await page.content();
  await browser.close();

  const $ = load(html);
  const items: ListingItem[] = [];
  $('ul.items-list li > a').each((_, el) => {
    const title = $(el).find('.item-title').text().trim();
    const priceText = $(el).find('.item-price').text()
      .replace(/[^\d.,]/g, '')
      .replace(',', '.');
    const price = parseFloat(priceText) || 0;
    const link = $(el).attr('href') || '';
    const itemUrl = link.startsWith('http') ? link : \`https://www.subito.it\${link}\`;
    items.push({ title, price, url: itemUrl });
  });

  return items;
}
