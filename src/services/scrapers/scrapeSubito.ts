import chromium from 'chrome-aws-lambda';
import puppeteer from 'puppeteer';
import { load } from 'cheerio';
import type { ListingItem } from '../../types';

export async function scrapeSubito(query: string): Promise<ListingItem[]> {
  // Prova a usare chrome-aws-lambda, altrimenti fallback su puppeteer locale
  const exePath = await chromium.executablePath;
  const launchArgs = {
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: exePath || process.env.CHROME_BIN,
    headless: chromium.headless,
  };

  const browser = exePath
    ? await chromium.puppeteer.launch(launchArgs)
    : await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });

  const page = await browser.newPage();
  const url = `https://www.subito.it/annunci-italia/vendita/tutto/?q=${encodeURIComponent(query)}`;
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

  const html = await page.content();
  await browser.close();

  const $ = load(html);
  const items: ListingItem[] = [];

  $('ul.items-list li > a').each((_, el) => {
    const title = $(el).find('.item-title').text().trim();
    const priceText = $(el)
      .find('.item-price')
      .text()
      .replace(/[^\d.,]/g, '')
      .replace(',', '.');
    const price = parseFloat(priceText) || 0;
    const link = $(el).attr('href') || '';
    const itemUrl = link.startsWith('http') ? link : `https://www.subito.it${link}`;
    items.push({
      id: itemUrl,
      title,
      description: '',      // Subito non fornisce descrizione nella lista
      price,
      imageUrl: '',         // se serve, si può estrarre da data-src
      url: itemUrl,
      source: 'subito',
      location: '',         // opzionale, si può parsare da pagina
      date: Date.now(),     // oppure parsare data se disponibile
    });
  });

  return items;
}
