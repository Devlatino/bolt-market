// src/services/scrapers/scrapeSubito.ts
import type { ListingItem } from '../../types';
import axios from 'axios';
import { load } from 'cheerio';

export async function scrapeSubito(query: string): Promise<ListingItem[]> {
  console.log(`🚀 [scrapeSubito] start for query="${query}"`);

  // URL di ricerca Subito
  const url = `https://www.subito.it/annunci-italia/vendita/tutto/?q=${encodeURIComponent(query)}`;
  console.log(`📡 [scrapeSubito] fetching URL: ${url}`);

  const resp = await axios.get(url, { timeout: 60000 });
  const $ = load(resp.data);
  const items: ListingItem[] = [];

  // Selettore aggiornato per la struttura corrente di Subito
  $('article.js-ad-card').each((_, el) => {
    const anchor = $(el).find('a[href*="/annunci-italia"]');
    const title = anchor.find('h2').text().trim();
    if (!title) return;

    const priceText = $(el)
      .find('.Price__price')
      .text()
      .replace(/[^\d.,]/g, '')
      .replace(',', '.');
    const price = parseFloat(priceText) || 0;

    const link = anchor.attr('href') || '';
    const itemUrl = link.startsWith('http') ? link : `https://www.subito.it${link}`;

    const imageUrl = $(el).find('img').attr('src') || '';
    const location = $(el).find('.AdCard__region').text().trim() || '';

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
