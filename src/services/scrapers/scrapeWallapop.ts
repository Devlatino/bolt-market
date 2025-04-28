// src/services/scrapers/scrapeWallapop.ts
import type { ListingItem } from '../../types';
import axios from 'axios';
import { load } from 'cheerio';

const ITEMS_PER_PAGE = 20;

/** Cerca ricorsivamente nel JSON un array di oggetti con chiavi 'title' e 'id' */
function findAdsArray(obj: any): any[] | null {
  if (Array.isArray(obj) && obj.length > 0 && typeof obj[0] === 'object') {
    const keys = Object.keys(obj[0]);
    if (keys.includes('title') && (keys.includes('id') || keys.includes('uri') || keys.includes('link'))) {
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

/** Mappa un oggetto JSON di Wallapop in ListingItem */
function mapJsonAd(ad: any): ListingItem {
  const title = ad.title || '';
  let price = 0;
  if (ad.price?.amount) price = Number(ad.price.amount) || 0;
  else if (typeof ad.price === 'string') price = parseFloat(ad.price.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;

  const uri = ad.uri || ad.link || '';
  const url = uri.startsWith('http') ? uri : `https://es.wallapop.com${uri}`;

  const imageUrl = Array.isArray(ad.images) && ad.images.length > 0
    ? ad.images[0].url || ad.images[0]
    : '';

  const location = ad.location?.city || ad.location?.region || '';
  const date = ad.creationTime
    ? new Date(ad.creationTime).getTime()
    : Date.now();

  return {
    id:          ad.id ?? url,
    title,
    description: ad.description || '',
    price,
    imageUrl,
    url,
    source:      'wallapop',
    location,
    date,
  };
}

export async function scrapeWallapop(
  query: string,
  page = 1
): Promise<ListingItem[]> {
  console.log(`🚀 [scrapeWallapop] start for query="${query}", page=${page}`);
  const offset = (page - 1) * ITEMS_PER_PAGE;
  const searchUrl =
    `https://es.wallapop.com/app/search?searchTerm=${encodeURIComponent(query)}` +
    `&orderBy=creation_time&offset=${offset}`;

  let html: string;
  try {
    const resp = await axios.get<string>(searchUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
          'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
        'Accept-Language': 'es-ES,es;q=0.9'
      },
      timeout: 60000,
    });
    html = resp.data;
  } catch (err) {
    console.error('❌ [scrapeWallapop] axios GET failed:', err);
    return [];
  }

  const $ = load(html);
  // ─── JSON-BASED ──────────────────────────────────────────
  const script = $('#__NEXT_DATA__').html();
  if (script) {
    try {
      const data = JSON.parse(script);
      const ads = findAdsArray(data);
      if (ads?.length) {
        const items = ads.map(mapJsonAd);
        console.log(`✅ [scrapeWallapop] JSON-based found ${items.length} items`);
        return items;
      }
      console.warn('⚠️ [scrapeWallapop] JSON-based zero items');
    } catch (err) {
      console.error('❌ [scrapeWallapop] JSON parse failed:', err);
    }
  } else {
    console.warn('⚠️ [scrapeWallapop] __NEXT_DATA__ non trovato');
  }

  // ─── HTML FALLBACK ─────────────────────────────────────────
  console.warn('⚠️ [scrapeWallapop] uso fallback HTML scraping');
  const items: ListingItem[] = [];
  $('article[data-testid="card"]').each((_, el) => {
    const card = $(el);
    const title = card.find('h3[data-testid="title"]').text().trim();
    const priceText = card
      .find('span[data-testid="price"]')
      .first()
      .text()
      .trim();
    const price = parseFloat(
      priceText.replace(/[^\d.,]/g, '').replace(',', '.')
    ) || 0;
    const linkPath = card.find('a[data-testid="card-link"]').attr('href') || '';
    const url = linkPath.startsWith('http')
      ? linkPath
      : `https://es.wallapop.com${linkPath}`;
    const imageUrl =
      card.find('img[data-testid="picture"]').attr('src') || '';
    const location = card.find('div[data-testid="location"]')?.text().trim() || '';
    const date = Date.now();

    items.push({
      id:          url,
      title,
      description: '',
      price,
      imageUrl,
      url,
      source:      'wallapop',
      location,
      date,
    });
  });
  console.log(`✅ [scrapeWallapop] HTML fallback found ${items.length} items`);
  return items;
}
