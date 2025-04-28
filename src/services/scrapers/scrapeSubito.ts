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

export async function scrapeSubito(
  query: string,
  page: number = 1
): Promise<ListingItem[]> {
  console.log(`🚀 [scrapeSubito] start for query="${query}", page=${page}`);

  const offset = (page - 1) * ITEMS_PER_PAGE;
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

  // Carica l'HTML e isola __NEXT_DATA__
  const $ = load(html);
  const script = $('#__NEXT_DATA__').html();
  if (!script) {
    console.warn('⚠️ [scrapeSubito] __NEXT_DATA__ non trovato');
    return [];
  }

  let nextData: any;
  try {
    nextData = JSON.parse(script);
  } catch (err) {
    console.error('❌ [scrapeSubito] parsing JSON fallito:', err);
    return [];
  }

  // Trova dinamicamente l'array di annunci
  const adsArray = findAdsArray(nextData);
  if (!adsArray) {
    console.warn('⚠️ [scrapeSubito] non ho trovato l’array di annunci in __NEXT_DATA__');
    return [];
  }

  // Mappa ogni annuncio in ListingItem
  const items: ListingItem[] = adsArray.map((ad: any) => {
    const title       = ad.title || '';
    const linkPath    = ad.link || ad.url || '';
    const itemUrl     = linkPath.startsWith('http')
                        ? linkPath
                        : `https://www.subito.it${linkPath}`;
    let price: number = 0;
    if (typeof ad.price === 'string') {
      price = parseFloat(ad.price.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
    } else if (ad.price?.amount) {
      price = Number(ad.price.amount) || 0;
    }
    const imageUrl    = ad.images?.[0]?.url || ad.image || '';
    const location    = ad.city || ad.location || '';
    const date        = ad.date ? new Date(ad.date).getTime() : Date.now();

    return {
      id:          ad.id ?? itemUrl,
      title,
      description: ad.description || '',
      price,
      imageUrl,
      url:         itemUrl,
      source:      'subito',
      location,
      date,
    };
  });

  console.log(`✅ [scrapeSubito] found ${items.length} items`);
  return items;
}
