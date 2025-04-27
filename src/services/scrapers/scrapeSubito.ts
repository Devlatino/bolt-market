import puppeteer from 'puppeteer';
import { load } from 'cheerio';
import chromium from 'chrome-aws-lambda';
import type { Browser } from 'puppeteer-core';

export interface Item { title: string; price: number; url: string; imageUrl: string; site: string; }

export async function scrapeSubito(query: string): Promise<Item[]> {
  const browser: Browser = await chromium.puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath,
    headless: chromium.headless,
  });
  const page = await browser.newPage();
  const url = `https://www.subito.it/annunci-italia/vendita/usato/?q=${encodeURIComponent(query)}`;
  await page.goto(url, { waitUntil: 'networkidle0' });
  const html = await page.content();
  await browser.close();

  const $ = load(html);
  const items: Item[] = [];
  $('.items-list .ItemSnippet').each((_, el) => {
    const title = $(el).find('.ItemSnippet__title').text().trim();
    const priceText = $(el).find('.ItemSnippet__price').text().replace(/[^0-9,.]/g, '').replace(',', '.');
    const price = parseFloat(priceText) || 0;
    const relative = $(el).find('a').attr('href') ?? '';
    const urlItem = relative.startsWith('http') ? relative : `https://www.subito.it${relative}`;
    const imageUrl = $(el).find('img').attr('src') ?? '';
    items.push({ title, price, url: urlItem, imageUrl, site: 'Subito' });
  });
  return items;
}
