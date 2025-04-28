// src/services/scrapers/scrapeLeboncoin.ts
import type { ListingItem } from '../../types';
import axios from 'axios';
import { load } from 'cheerio';

const ITEMS_PER_PAGE = 30;

/**
 * Cerca ricorsivamente nel JSON un array di oggetti con chiavi 'id' e 'title'
 */
function findAdsArray(obj: any): any[] | null {
  if (Array.isArray(obj) && obj.length > 0 && typeof obj[0] === 'object') {
    const keys = Object.keys(obj[0]);
    if (keys.includes('id') && keys.includes('title')) {
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

/**
 * Mappa un oggetto JSON di Leboncoin in ListingItem
 */
function mapJsonAd(ad: any): ListingItem {
  const title = ad.title || '';
  let price = 0;

  if (typeof ad.price === 'number') {
    price = ad.price;
  } else if (ad.price?.value) {
    price = Number(ad.price.value) || 0;
  } else if (typeof ad.price === 'string') {
    // rimuove tutto tranne cifre, punti e virgole
    price = parseFloat(
      ad.price.replace(/[^
\d.,]/g, '').replace(',', '.')
    ) || 0;
  }

  const path = ad.uri || ad.url || '';
  const url = path.startsWith('http') ? path : `https://www.leboncoin.fr${path}`;

  const imageUrl = ad.images?.[0] || ad.pictures?.[0]?.url || '';
  const location = ad.location?.city || '';
  const date = ad.creation_date
    ? new Date(ad.creation_date).getTime()
    : ad.sort_date
      ? new Date(ad.sort_date).getTime()
      : Date.now();

  return {
    id: url,
    title,
    description: ad.description || '',
    price,
    imageUrl,
    url,
    source: 'leboncoin',
    location,
    date,
  };
}

/**
 * Scrape Leboncoin con approccio JSON-based e fallback HTML
 */
export async function scrapeLeboncoin(
  query: string,
  page = 1
): Promise<ListingItem[]> {
  console.log(`🚀 [scrapeLeboncoin] query="${query}", page=${page}`);
  const url = `https://www.leboncoin.fr/recherche?text=${encodeURIComponent(
    query
  )}&page=${page}`;

  let html: string;
  try {
    const resp = await axios.get<string>(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
          'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8',
      },
      timeout: 60000,
    });
    html = resp.data;
  } catch (err) {
    console.error('❌ [scrapeLeboncoin] axios GET failed:', err);
    return [];
  }

  const $ = load(html);

  // ─── JSON-BASED ─────────────────────────────────────────
  const script = $('script#__NEXT_DATA__').html();
  if (script) {
    try {
      const data = JSON.parse(script);
      const ads = findAdsArray(data);
      if (ads?.length) {
        const items = (ads as any[]).map(mapJsonAd);
        console.log(`✅ [scrapeLeboncoin] JSON-based found ${items.length} items`);
        return items;
      }
      console.warn('⚠️ [scrapeLeboncoin] JSON-based zero items');
    } catch (err) {
      console.error('❌ [scrapeLeboncoin] JSON parse failed:', err);
    }
  } else {
    console.warn('⚠️ [scrapeLeboncoin] __NEXT_DATA__ not found');
  }

  // ─── HTML FALLBACK ─────────────────────────────────────────
  console.warn('⚠️ [scrapeLeboncoin] using HTML fallback selectors');
  const items: ListingItem[] = [];
  $('section.mainList ul li a.list_item').each((_, el) => {
    const e = $(el);
    const title = e.find('section.item_infos h2.item_title').text().trim();
    const priceText = e.find('section.item_infos h3.item_price').text();
    const price =
      parseFloat(
        priceText.replace(/[^
\d.,]/g, '').replace(',', '.')
      ) || 0;
    const href = e.attr('href') || '';
    const itemUrl = href.startsWith('http') ? href : `https://www.leboncoin.fr${href}`;
    const imgUrl = e.find('div.item_imagePic span').attr('data-imgsrc') || '';
    const date = Date.now();

    items.push({
      id: itemUrl,
      title,
      description: '',
      price,
      imageUrl: imgUrl,
      url: itemUrl,
      source: 'leboncoin',
      location: '',
      date,
    });
  });
  console.log(`✅ [scrapeLeboncoin] HTML fallback found ${items.length} items`);
  return items;
}
