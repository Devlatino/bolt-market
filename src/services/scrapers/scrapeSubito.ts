// src/services/scrapers/scrapeSubito.ts
import type { ListingItem } from '../../types';
import axios from 'axios';
import { load } from 'cheerio';

const ITEMS_PER_PAGE = 20;

export async function scrapeSubito(
  query: string,
  page: number = 1
): Promise<ListingItem[]> {
  console.log(`🚀 [scrapeSubito] start for query="${query}", page=${page}`);

  // Calcola l'offset: pagina 1 ⇒ offset 0, pagina 2 ⇒ offset 20, ecc.
  const offset = (page - 1) * ITEMS_PER_PAGE;
  const baseUrl = `https://www.subito.it/annunci-italia/vendita/tutto/`;
  const url = offset > 0
    ? `${baseUrl}?q=${encodeURIComponent(query)}&o=${offset}`
    : `${baseUrl}?q=${encodeURIComponent(query)}`;

  console.log(`📡 [scrapeSubito] fetching URL: ${url}`);

  const resp = await axios.get(url, { timeout: 60000 });
  const $ = load(resp.data);
  const items: ListingItem[] = [];

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

    // Immagine
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
