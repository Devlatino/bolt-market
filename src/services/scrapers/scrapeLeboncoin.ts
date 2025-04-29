/// src/services/scrapers/scrapeLeboncoin.ts
import axios from 'axios';
import type { ListingItem } from '../../types';

/**
 * Scrape Leboncoin leveraging the server-rendered JSON in __NEXT_DATA__
 * without launching a headless browser.
 */
export async function scrapeLeboncoin(query: string, page = 1): Promise<ListingItem[]> {
  const offset = page;
  const url = `https://www.leboncoin.fr/recherche?text=${encodeURIComponent(query)}&page=${offset}`;

  // Effettua una GET simulando un browser
  const resp = await axios.get<string>(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      'Accept-Language': 'fr-FR,fr;q=0.9'
    },
    timeout: 30000
  });

  // Estrai il JSON SSR
  const match = resp.data.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!match || match.length < 2) return [];

  const nextData = JSON.parse(match[1]);
  // Percorsi possibili dentro __NEXT_DATA__
  const rawAds: any[] =
    nextData.props?.pageProps?.initialProps?.searchData?.ads ||
    nextData.props?.pageProps?.ads ||
    [];

  return rawAds.map(ad => {
    const link = ad.ad_link || ad.url || '';
    const fullUrl = link.startsWith('http') ? link : `https://www.leboncoin.fr${link}`;

    return {
      id: fullUrl,
      title: ad.title || ad.subject || '',
      description: ad.body || ad.description || '',
      price: Number(ad.price) || 0,
      imageUrl: ad.images?.[0] || '',
      url: fullUrl,
      source: 'leboncoin',
      location: ad.location?.city || ad.department || '',
      date: ad.creation_date ? Date.parse(ad.creation_date) : Date.now()
    } as ListingItem;
  });
}
