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
  const url = \`https://www.subito.it/annunci-italia/vendita/usato/?q=\${encodeURIComponent(query)}\`;
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
  const html = await page.content();
  await browser.close();

  const $ = load(html);
  const items: ListingItem[] = [];
  $('.items-list .ItemSnippet').each((_, el) => {
    const title = $(el).find('.ItemSnippet__title').text().trim();
    const priceText = $(el).find('.ItemSnippet__price').text()
      .replace(/[^0-9.,]/g, '')
      .replace(',', '.');
    const price = parseFloat(priceText) || 0;
    const relative = $(el).find('a').attr('href') || '';
    const itemUrl = relative.startsWith('http') ? relative : \`https://www.subito.it\${relative}\`;
    const imageUrl = $(el).find('img').attr('src') || '';
    items.push({ title, price, url: itemUrl, imageUrl, site: 'Subito' });
  });
  return items;
}
