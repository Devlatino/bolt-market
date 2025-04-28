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
  // Path corretto per usato
  const baseUrl = 'https://www.subito.it/annunci-italia/vendita/usato/';
  const url     = `${baseUrl}?q=${encodeURIComponent(query)}&o=${offset}`;

  console.log(`📡 [scrapeSubito] fetching URL: ${url}`);

  // Impostiamo headers per sembrare un browser
  const headers = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
      'AppleWebKit/537.36 (KHTML, like Gecko) ' +
      'Chrome/115.0.0.0 Safari/537.36',
    'Accept-Language': 'it-IT,it;q=0.9,en-US;q=0.8',
  };

  let html: string;
  try {
    const resp = await axios.get<string>(url, { headers, timeout: 60000 });
    html = resp.data;
  } catch (err) {
    console.error('❌ [scrapeSubito] axios GET failed:', err);
    return [];
  }

  // Parsiamo il DOM
  const $ = load(html);
  const items: ListingItem[] = [];

  // Ogni card è dentro un <li data-testid="listing-card">
  $('li[data-testid="listing-card"]').each((_, el) => {
    const $el = $(el);
    const anchor = $el.find('a[href*="/annunci-italia"]');
    const title  = anchor.find('h3').text().trim();
    if (!title) return;

    const priceText = $el
      .find('[data-testid="ad-price"]')
      .first()
      .text()
      .replace(/[^\d.,]/g, '')
      .replace(',', '.');
    const price = parseFloat(priceText) || 0;

    const link = anchor.attr('href') || '';
    const itemUrl = link.startsWith('http')
      ? link
      : `https://www.subito.it${link}`;

    const imgEl = $el.find('img');
    const imageUrl =
      imgEl.attr('data-src')?.trim() ||
      imgEl.attr('src')?.trim() ||
      '';

    const location = $el
      .find('[data-testid="ad-location"]')
      .first()
      .text()
      .trim();

    items.push({
      id:       itemUrl,
      title,
      description: '',
      price,
      imageUrl,
      url:      itemUrl,
      source:   'subito',
      location,
      date:     Date.now(),
    });
  });

  console.log(`✅ [scrapeSubito] found ${items.length} items`);
  return items;
}
