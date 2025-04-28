// src/services/scrapers/scrapeSubito.ts

import type { ListingItem } from '../../types';
import axios from 'axios';
import { load } from 'cheerio';

const ITEMS_PER_PAGE = 20;

/** Cerca ricorsivamente nel JSON un array di oggetti con chiavi 'title' e 'link' */
function findAdsArray(obj: any): any[] | null {
  if (Array.isArray(obj) && obj.length > 0 && typeof obj[0] === 'object') {
    const keys = Object.keys(obj[0]);
    if (keys.includes('title') && (keys.includes('link') || keys.includes('id'))) {
      return obj;
    }
  }
  if (obj && typeof obj === 'object') {
    for (const key of Object.keys(obj)) {
      const found = findAdsArray(obj[key]);
      if (found) return found;
    }
  }
  return null;
}

/** Mappa un oggetto JSON di Subito in un ListingItem */
function mapJsonAdToItem(ad: any): ListingItem {
  const title      = ad.title || '';
  const linkPath   = ad.link || ad.url || '';
  const url        = linkPath.startsWith('http')
                     ? linkPath
                     : `https://www.subito.it${linkPath}`;
  let price: number = 0;
  if (typeof ad.price === 'string') {
    price = parseFloat(ad.price.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
  } else if (ad.price?.amount) {
    price = Number(ad.price.amount) || 0;
  }
  const imageUrl = ad.images?.[0]?.url || ad.image || '';
  const location = ad.city || ad.location || '';
  const date     = ad.date ? new Date(ad.date).getTime() : Date.now();

  return {
    id:          ad.id ?? url,
    title,
    description: ad.description || '',
    price,
    imageUrl,
    url,
    source:      'subito',
    location,
    date,
  };
}

export async function scrapeSubito(
  query: string,
  page: number = 1
): Promise<ListingItem[]> {
  console.log(`🚀 [scrapeSubito] start for query="${query}", page=${page}`);

  const offset  = (page - 1) * ITEMS_PER_PAGE;
  const baseUrl = 'https://www.subito.it/annunci-italia/vendita/usato/';
  const url     = `${baseUrl}?q=${encodeURIComponent(query)}&o=${offset}`;

  console.log(`📡 [scrapeSubito] fetching URL: ${url}`);
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

  const $ = load(html);

  // ─── Tentativo JSON-based ───────────────────────────────────────────────
  const script = $('#__NEXT_DATA__').html();
  if (script) {
    try {
      const nextData = JSON.parse(script);
      const adsArray = findAdsArray(nextData);
      if (adsArray && adsArray.length > 0) {
        const items = adsArray.map(mapJsonAdToItem);
        console.log(`✅ [scrapeSubito] JSON-based found ${items.length} items`);
        return items;
      }
      console.warn('⚠️ [scrapeSubito] JSON-based conteneva zero elementi');
    } catch (err) {
      console.error('❌ [scrapeSubito] parsing JSON fallito:', err);
    }
  } else {
    console.warn('⚠️ [scrapeSubito] __NEXT_DATA__ non trovato');
  }

  // ─── Fallback HTML Scraping ───────────────────────────────────────────
  console.warn('⚠️ [scrapeSubito] uso fallback HTML scraping');
  const htmlItems: ListingItem[] = [];

  $('div[class*="item-card"]').each((_, el) => {
    const card = $(el);

    // Escludi prodotti venduti
    if (card.find('span.item-sold-badge').length) return;

    // Titolo
    const title = card.find('h2').first().text().trim();

    // Prezzo
    let priceText = card.find('p[class*="price"]').first().text().trim();
    priceText = priceText.replace(/<[^>]+>/g, ''); // rimuovi eventuali tag
    const price = parseFloat(priceText.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;

    // Link
    const linkPath = card.find('a').attr('href') || '';
    const itemUrl  = linkPath.startsWith('http')
                     ? linkPath
                     : `https://www.subito.it${linkPath}`;

    // Immagine
    const imageUrl = card.find('img').first().attr('src') || '';

    // Località
    const town     = card.find('span.town').text().trim();
    const city     = card.find('span.city').text().trim();
    const location = [town, city].filter(Boolean).join(' ');

    // Data (non disponibile in HTML, uso timestamp corrente)
    const date = Date.now();

    htmlItems.push({
      id:          itemUrl,
      title,
      description: '',
      price,
      imageUrl,
      url:         itemUrl,
      source:      'subito',
      location,
      date,
    });
  });

  console.log(`✅ [scrapeSubito] HTML scraping trovato ${htmlItems.length} items`);
  return htmlItems;
}
