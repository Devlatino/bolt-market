/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ListingItem } from '../../types';
import axios from 'axios';

const ITEMS_PER_PAGE = 20;

export async function scrapeWallapop(query: string, page = 1): Promise<ListingItem[]> {
  const offset = (page - 1) * ITEMS_PER_PAGE;
  const resp = await axios.get('https://api.wallapop.com/api/v3/general/search', {
    params: { keywords: query, order_by: 'creation_time', offset, limit: ITEMS_PER_PAGE }
  });
  const rawAds: any[] = resp.data.search_objects || [];
  return rawAds.map((ad: any) => {
    const uri = ad.uri || ad.link || '';
    const url = uri.startsWith('http') ? uri : `https://www.wallapop.com${uri}`;
    const price = ad.price?.amount ? Number(ad.price.amount) : parseFloat(ad.price) || 0;
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
