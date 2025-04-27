// src/services/scrapers/scrapeSubito.ts
import chromium from 'chrome-aws-lambda';
import { load } from 'cheerio';
import type { ListingItem } from '../../types';

export async function scrapeSubito(query: string): Promise<ListingItem[]> {
  console.log(`🚀 [scrapeSubito] start for query="${query}"`);

  // Usa solo chrome-aws-lambda per compatibilità con Vercel
  const executablePath = await chromium.executablePath;
  const browser = await chromium.puppeteer.launch({
    args: chromium.args.concat(['--no-sandbox', '--disable-setuid-sandbox']),
    defaultViewport: chromium.defaultViewport,
    executablePath,
    headless: chromium.headless,
  });

  const page = await browser.newPage();
  const url = `https://www.subito.it/annunci-italia/vendita/tutto/?q=${encodeURIComponent(query)}`;
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

  const html = await page.content();
  await browser.close();

  const $ = load(html);
  const items: ListingItem[] = [];

  // Selettore aggiornato alla UI corrente di Subito
  $('div.ads__unit__content a').each((_, el) => {
    const title = $(el).find('h2').text().trim();
    const priceText = $(el).find('.Pricestyles__Price-sc').text()
      .replace(/[^\d.,]/g, '')
      .replace(',', '.');
    const price = parseFloat(priceText) || 0;
    const link = $(el).attr('href') || '';
    const itemUrl = link.startsWith('http') ? link : `https://www.subito.it${link}`;

    items.push({
      id: itemUrl,
      title,
      description: '',
      price,
      imageUrl: '',
      url: itemUrl,
      source: 'subito',
      location: '',
      date: Date.now(),
    });
  });

  console.log(`✅ [scrapeSubito] found ${items.length} items`);
  return items;
}
