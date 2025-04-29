// src/services/scrapers/scrapeWallapop.ts
import axios from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';
import type { ListingItem } from '../../types';

/**
 * Scrape Wallapop gestendo manualmente cookie e header richiesti.
 */
export async function scrapeWallapop(query: string, page = 1): Promise<ListingItem[]> {
  // 1) Cookie jar e client axios “browser‐like”
  const jar = new CookieJar();
  const client = wrapper(axios.create({
    jar,
    withCredentials: true,
    headers: {
      'User-Agent':      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
      'Accept-Language': 'it-IT,it;q=0.9',
    },
    timeout: 20000
  }));

  // 2) Hitto la pagina es.wallapop.com per ottenere i cookie di sessione
  const refererPage = `https://es.wallapop.com/search?keywords=${encodeURIComponent(query)}`;
  await client.get(refererPage);

  // 3) Richiesta all’API con gli stessi cookie
  const limit  = 20;
  const offset = (page - 1) * limit;
  const apiUrl = 'https://api.wallapop.com/api/v3/general/search';
  const resp   = await client.get(apiUrl, {
    params: {
      keywords:  query,
      offset,
      limit,
      order_by: 'creation_time'
    },
    headers: {
      Referer: refererPage,
      Accept:  'application/json, text/plain, */*'
    }
  });

  // 4) Estraggo i risultati
  const items: any[] = resp.data.search_objects || [];
  return items.map(ad => {
    const uri     = ad.uri    || ad.link || '';
    const fullUrl = uri.startsWith('http') ? uri : `https://www.wallapop.com${uri}`;
    const priceValue = (ad.price?.amount ?? parseFloat(String(ad.price))) || 0;

    return {
      id:           ad.id ?? fullUrl,
      title:        ad.title        || '',
      description:  ad.description  || '',
      price:        priceValue,
      imageUrl:     ad.images?.[0]?.url || '',
      url:          fullUrl,
      source:       'wallapop',
      location:     ad.location?.city || '',
      date:         ad.creationTime ? Date.parse(ad.creationTime) : Date.now()
    } as ListingItem;
  });
}
