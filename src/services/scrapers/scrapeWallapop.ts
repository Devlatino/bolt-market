// src/services/scrapers/scrapeWallapop.ts

import axios from 'axios';
import { CookieJar } from 'tough-cookie';
import type { ListingItem } from '../../types';

/**
 * Scrape Wallapop senza browser headless,
 * gestendo i cookie di sessione e WAF con tough-cookie
 * e caricando axios-cookiejar-support con dynamic import.
 */
export async function scrapeWallapop(
  query: string,
  page: number = 1
): Promise<ListingItem[]> {
  // 1) Dynamic import di axios-cookiejar-support (modulo ESM)
  const { wrapper } = await import('axios-cookiejar-support');

  // 2) Preparo un CookieJar per mantenere i cookie tra le richieste
  const jar = new CookieJar();

  // 3) Creo un client axios “browser‐like” con jar e header
  const client = wrapper(
    axios.create({
      jar,
      withCredentials: true,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
          'AppleWebKit/537.36 (KHTML, like Gecko) ' +
          'Chrome/114.0.0.0 Safari/537.36',
        'Accept-Language': 'it-IT,it;q=0.9',
      },
      timeout: 20000,
    })
  );

  // 4) Prima richiesta “clean” alla pagina di ricerca per ottenere i cookie di sessione/WAF
  const refererPage = `https://es.wallapop.com/search?keywords=${encodeURIComponent(query)}`;
  await client.get(refererPage);

  // 5) Chiamata all’API con stesse credenziali e cookie
  const limit = 20;
  const offset = (page - 1) * limit;
  const apiUrl = 'https://api.wallapop.com/api/v3/general/search';

  const resp = await client.get(apiUrl, {
    params: {
      keywords: query,
      offset,
      limit,
      order_by: 'creation_time',
    },
    headers: {
      Referer: refererPage,
      Accept: 'application/json, text/plain, */*',
    },
  });

  // 6) Mappo i risultati in ListingItem
  const items: any[] = resp.data.search_objects || [];
  return items.map((ad) => {
    const uri = ad.uri || ad.link || '';
    const fullUrl = uri.startsWith('http')
      ? uri
      : `https://www.wallapop.com${uri}`;

    const priceValue =
      (ad.price?.amount ?? parseFloat(String(ad.price))) || 0;

    return {
      id:           ad.id ?? fullUrl,
      title:        ad.title        || '',
      description:  ad.description  || '',
      price:        priceValue,
      imageUrl:     ad.images?.[0]?.url || '',
      url:          fullUrl,
      source:       'wallapop',
      location:     ad.location?.city || '',
      date:         ad.creationTime
                       ? Date.parse(ad.creationTime)
                       : Date.now(),
    } as ListingItem;
  });
}
