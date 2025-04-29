/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ListingItem } from '../../types';
import axios from 'axios';

const ITEMS_PER_PAGE = 20;

export async function scrapeWallapop(query: string, page = 1): Promise<ListingItem[]> {
  const offset = (page - 1) * ITEMS_PER_PAGE;
  const endpoint = 'https://api.wallapop.com/api/v3/general/search';

  // Header “mobile” + Referer/Origin per evitare 403
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Linux; Android 11; Pixel 4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Mobile Safari/537.36',
    'Accept-Language': 'it-IT,it;q=0.9',
    'Referer': 'https://es.wallapop.com/',
    'Origin': 'https://es.wallapop.com'
  };

  const resp = await axios.get(endpoint, {
    headers,
    params: {
      keywords: query,
      order_by: 'creation_time',
      offset,
      limit: ITEMS_PER_PAGE
    },
    timeout: 30000
  });

  const rawAds: any[] = resp.data.search_objects || [];
  return rawAds.map((ad) => {
    const uri = ad.uri || ad.link || '';
    const url = uri.startsWith('http') ? uri : `https://www.wallapop.com${uri}`;
    const price = ad.price?.amount
      ? Number(ad.price.amount)
      : parseFloat(ad.price) || 0;

    return {
      id: ad.id || url,
      title: ad.title || '',
      description: ad.description || '',
      price,
      imageUrl: ad.images?.[0]?.url || '',
      url,
      source: 'wallapop',
      location: ad.location?.city || '',
      date: ad.creationTime ? Date.parse(ad.creationTime) : Date.now()
    };
  });
}
