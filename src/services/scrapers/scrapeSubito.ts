// File: src/services/scrapers/scrapeSubito.ts
import chromium from 'chrome-aws-lambda';
import puppeteer from 'puppeteer';
import type { ListingItem } from '../../types';

export async function scrapeSubito(query: string): Promise<ListingItem[]> {
  const exePath = await chromium.executablePath;
  const launchOptions = {
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: exePath || undefined,
    headless: chromium.headless,
  };
  const browser = exePath
    ? await chromium.puppeteer.launch(launchOptions)
    : await puppeteer.launch({ headless: true });

  try {
    const page = await browser.newPage();
    await page.goto(
      `https://www.subito.it/annunci-italia/vendita/?q=${encodeURIComponent(query)}`,
      { waitUntil: 'networkidle2' }
    );
    // Attendi che i risultati siano renderizzati
    await page.waitForSelector('ul.items-list li, div[data-testid="card-list"] article');

    const rawItems = await page.evaluate(() => {
      const cards = Array.from(
        document.querySelectorAll('ul.items-list li, div[data-testid="card-list"] article')
      ) as HTMLElement[];
      return cards.map(card => {
        const a = card.querySelector('a');
        const href = a?.href || '';
        const titleEl = card.querySelector('h2, h3');
        const title = titleEl?.textContent?.trim() || '';
        const imgEl = card.querySelector('img');
        const img = imgEl?.src || imgEl?.getAttribute('data-src') || '';
        const priceEl = card.querySelector('[data-testid="price"], .Price_main');
        const priceText = priceEl?.textContent?.trim() || '';
        return { href, title, img, priceText };
      });
    });

    const items: ListingItem[] = rawItems.map(({ href, title, img, priceText }) => {
      const price = parseFloat(
        priceText.replace(/[^\d.,]/g, '').replace(/\./g, '').replace(',', '.')
      ) || 0;
      return {
        id: href,
        title,
        description: title,
        price,
        imageUrl: img,
        url: href,
        source: 'subito',
        location: '',
        date: Date.now(),
      };
    });

    return items;
  } finally {
    await browser.close();
  }
}