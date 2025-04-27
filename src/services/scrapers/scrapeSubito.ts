// File: src/services/scrapers/scrapeSubito.ts
import chromium from 'chrome-aws-lambda';
import type { ListingItem } from '../../types';
import puppeteer from 'puppeteer-core';

export async function scrapeSubito(query: string): Promise<ListingItem[]> {
  const execPath = await chromium.executablePath;
  if (!execPath) {
    throw new Error('Chrome executable not found for scraping Subito');
  }

  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: execPath,
    headless: chromium.headless,
  });

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

    return rawItems.map(({ href, title, img, priceText }) => {
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
  } finally {
    await browser.close();
  }
}
