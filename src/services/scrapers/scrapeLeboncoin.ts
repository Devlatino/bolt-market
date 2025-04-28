/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ListingItem } from '../../types';
import axios from 'axios';

const ITEMS_PER_PAGE = 30;

export async function scrapeLeboncoin(query: string, page = 1): Promise<ListingItem[]> {
  const resp = await axios.get('https://api.leboncoin.fr/finder/search', {
    params: { text: query, page, limit: ITEMS_PER_PAGE },
    headers: { 'Accept-Language': 'fr-FR' }
  });
  const rawAds: any[] = resp.data.ads || [];
  return rawAds.map((ad: any) => {
    const path = ad.ad_link || ad.url || '';
    const url = path.startsWith('http') ? path : `https://www.leboncoin.fr${path}`;
    const price = Number(ad.price) || 0;
    return {
      id: url,
      title: ad.title || '',
      description: ad.body || '',
      price,
      imageUrl: ad.images?.[0] || '',
      url,
      source: 'leboncoin',
      location: ad.location?.city || '',
      date: ad.creation_date ? Date.parse(ad.creation_date) : Date.now()
    };
  });
}
