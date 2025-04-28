// src/services/scrapers/scrapeLeboncoin.ts

import type { ListingItem } from '../../types';
import axios from 'axios';
import { load } from 'cheerio';

const ITEMS_PER_PAGE = 30; // approx risultato per pagina

/** Cerca ricorsivamente un array di oggetti “ad” nel JSON */
function findAdsArray(obj: any): any[] | null {
  if (Array.isArray(obj) && obj.length > 0 && typeof obj[0] === 'object') {
    const keys = Object.keys(obj[0]);
    if (keys.includes('id') && keys.includes('title')) {
      return obj;
    }
  }
  if (obj && typeof obj === 'object') {
    for (const k of Object.keys(obj)) {
      const found = findAdsArray(obj[k]);
      if (found) return found;
    }
  }
  return null;
}

/** Mappa un oggetto JSON Leboncoin in ListingItem */
function mapJsonAdToItem(ad: any): ListingItem {
  const title       = ad.title || '';
  const description = ad.description || '';
  let price         = 0;
  if (typeof ad.price === 'number') {
    price = ad.price;
  } else if (ad.price?.value) {
    price = Number(ad.price.value) || 0;
  } else if (typeof ad.price === 'string') {
    price = parseFloat(ad.price.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
  }
  const linkPath = ad.uri || ad.url || ad.link || '';
  const url      = linkPath.startsWith('http')
                   ? linkPath
                   : `https://www.leboncoin.fr${linkPath}`;
  const imageUrl = (ad.images && ad.images[0]) ||
                   (ad.pictures && ad.pictures[0]?.url) ||
                   '';
  const location = ad.location?.city || ad.city || '';
  let date       = Date.now();
  if (ad.creation_date) {
    date = new Date(ad.creation_date).getTime();
  } else if (ad.sort_date) {
    date = new Date(ad.sort_date).getTime();
  }

  return {
    id:          url,
    title,
    description,
    price,
    imageUrl,
    url,
    source:      'leboncoin',
    location,
    date,
  };
}

/**
 * scrapeLeboncoin: JSON‐first, poi fallback HTML scraping
 */
export async function scrapeLeboncoin(
  query: string,
  page: number = 1
): Promise<ListingItem[]> {
  console.log(`🚀 [scrapeLeboncoin] query="${query}", page=${page}`);
  const searchUrl = `https://www.leboncoin.fr/recherche?text=${encodeURIComponent(query)}&page=${page}`;
  console.log(`📡 fetching: ${searchUrl}`);

  let html: string;
  try {
    const resp = await axios.get<string>(searchUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
          'AppleWebKit/537.36 (KHTML, like Gecko) ' +
          'Chrome/115.0.0.0 Safari/537.36',
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8',
      },
      timeout: 60000,
    });
    html = resp.data;
  } catch (err) {
    console.error('❌ [scrapeLeboncoin] GET failed:', err);
    return [];
  }

  const $ = load(html);

  // ─── JSON‐based scraping ───────────────────────────────────────────────
  const script = $('script#__NEXT_DATA__').html();
  if (script) {
    try {
      const nextData = JSON.parse(script);
      const adsArray = findAdsArray(nextData);
      if (adsArray && adsArray.length > 0) {
        const items = adsArray.map(mapJsonAdToItem);
        console.log(`✅ JSON-based trovato ${items.length} item`);
        return items;
      }
      console.warn('⚠️ JSON-based ha restituito 0 elementi');
    } catch (err) {
      console.error('❌ parsing JSON failed:', err);
    }
  } else {
    console.warn('⚠️ script#__NEXT_DATA__ non trovato');
  }

  // ─── Fallback HTML scraping ───────────────────────────────────────────
  console.warn('⚠️ uso fallback HTML scraping');
  const htmlItems: ListingItem[] = [];

  $('a[data-qa-id="aditem_container"]').each((_, el) => {
    const el$   = $(el);
    const href  = el$.attr('href') || '';
    const url   = href.startsWith('http') ? href : `https://www.leboncoin.fr${href}`;
    const title = el$.find('[data-qa-id="aditem_title"]').text().trim();
    const priceText = el$.find('[data-qa-id="aditem_price"]').text().trim();
    const price     = parseFloat(priceText.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
    const imageUrl  = el$.find('img').attr('src') || '';
    const locDate   = el$.find('[data-qa-id="aditem_location"]').text().trim();
    const location  = locDate.split('•')[0].trim();

    htmlItems.push({
      id:          url,
      title,
      description: '',
      price,
      imageUrl,
      url,
      source:      'leboncoin',
      location,
      date:        Date.now(),
    });
  });

  console.log(`✅ HTML scraping trovato ${htmlItems.length} item`);
  return htmlItems;
}
