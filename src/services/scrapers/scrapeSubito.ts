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

  const offset = (page - 1) * ITEMS_PER_PAGE;
  // NOTA: rimosso slash finale da `tutto`
  const baseUrl = `https://www.subito.it/annunci-italia/vendita/tutto`;
  const url =
    offset > 0
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

    const priceText = $(el)
      .find('div[data-testid="ad-price"]')
      .text()
      .replace(/[^\d.,]/g, '')
      .replace(',', '.');
    const price = parseFloat(priceText) || 0;

    const link = anchor.attr('href') || '';
    const itemUrl = link.startsWith('http')
      ? link
      : `https://www.subito.it${link}`;

    const imgEl = $(el).find('img');
    const imageUrl = imgEl.attr('data-src') || imgEl.attr('src') || '';

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
