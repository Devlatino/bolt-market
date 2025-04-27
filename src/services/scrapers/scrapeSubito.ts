// src/services/scrapers/scrapeSubito.ts
import type { ListingItem } from '../../types';
import axios from 'axios';
import { load } from 'cheerio';

export async function scrapeSubito(query: string): Promise<ListingItem[]> {
  console.log(`🚀 [scrapeSubito] start for query="${query}"`);

  const url = `https://www.subito.it/annunci-italia/vendita/tutto/?q=${encodeURIComponent(query)}`;
  console.log(`📡 [scrapeSubito] fetching URL: ${url}`);

  const resp = await axios.get(url, { timeout: 60000 });
  const $ = load(resp.data);
  const items: ListingItem[] = [];

  // Selettore aggiornato per i card di Subito
  $('article.js-ad-card').each((_, el) => {
    const anchor = $(el).find('a[href*="/annunci-italia"]');
    const title = anchor.find('h2').text().trim();
    if (!title) return;

    // Estrai prezzo
    const priceText = $(el)
      .find('div[data-testid="ad-price"]')
      .text()
      .replace(/[^\d.,]/g, '')
      .replace(',', '.');
    const price = parseFloat(priceText) || 0;

    // Link e URL
    const link = anchor.attr('href') || '';
    const itemUrl = link.startsWith('http')
      ? link
      : `https://www.subito.it${link}`;

    // Immagine: ora si trova in data-src o src su <img>
    const imgEl = $(el).find('img');
    const imageUrl = imgEl.attr('data-src') || imgEl.attr('src') || '';

    // Località
    const location = $(el)
      .find('div.ad-detail-location')
      .text()
      .trim() || '';

    items.push({
      id: itemUrl,
      title,
      description: '',
      price,
      imageUrl,
      url: itemUrl,
      source: 'subito',
      location,
      date: Date.now(),
    });
  });

  console.log(`✅ [scrapeSubito] found ${items.length} items`);
  return items;
}
