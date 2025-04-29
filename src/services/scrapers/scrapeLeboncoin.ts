// src/services/scrapers/scrapeLeboncoin.ts

import axios from 'axios';
import { CookieJar } from 'tough-cookie';
import type { ListingItem } from '../../types';

/**
 * Scrape Leboncoin senza browser headless,
 * gestendo i cookie di DataDome tramite tough-cookie
 * e caricando axios-cookiejar-support con dynamic import.
 */
export async function scrapeLeboncoin(
  query: string,
  page: number = 1
): Promise<ListingItem[]> {
  // 1) Dynamic import di axios-cookiejar-support (ESM)
  const { wrapper } = await import('axios-cookiejar-support');

  // 2) Preparo un CookieJar per mantenere la sessione
  const jar = new CookieJar();

  // 3) Inietto il jar in un client axios “browser‐like”
  const client = wrapper(
    axios.create({
      jar,
      withCredentials: true,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
          'AppleWebKit/537.36 (KHTML, like Gecko) ' +
          'Chrome/114.0.0.0 Safari/537.36',
        'Accept-Language': 'fr-FR,fr;q=0.9',
        'Accept':
          'text/html,application/xhtml+xml,application/xml;' +
          'q=0.9,*/*;q=0.8'
      },
      timeout: 30000
    })
  );

  // 4) Prima richiesta “clean” per raccogliere i cookie iniziali di DataDome
  await client.get('https://www.leboncoin.fr/');

  // 5) Richiesta vera e propria alla pagina di ricerca
  const url = `https://www.leboncoin.fr/recherche?text=${encodeURIComponent(
    query
  )}&page=${page}`;
  const resp = await client.get<string>(url, { responseType: 'text' });

  // 6) Estraggo il JSON SSR dal <script id="__NEXT_DATA__">
  const match = resp.data.match(
    /<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/
  );
  if (!match || match.length < 2) {
    return [];
  }
  const nextData = JSON.parse(match[1]);
  const rawAds: any[] =
    nextData.props?.pageProps?.initialProps?.searchData?.ads ||
    nextData.props?.pageProps?.ads ||
    [];

  // 7) Mappo i risultati in ListingItem
  return rawAds.map((ad) => {
    const link = ad.ad_link || ad.url || '';
    const fullUrl = link.startsWith('http')
      ? link
      : `https://www.leboncoin.fr${link}`;

    return {
      id:          fullUrl,
      title:       ad.title       || ad.subject     || '',
      description: ad.body        || ad.description || '',
      price:       Number(ad.price) || 0,
      imageUrl:    ad.images?.[0]  || '',
      url:         fullUrl,
      source:      'leboncoin',
      location:    ad.location?.city || ad.department || '',
      date:        ad.creation_date
                     ? Date.parse(ad.creation_date)
                     : Date.now()
    } as ListingItem;
  });
}
