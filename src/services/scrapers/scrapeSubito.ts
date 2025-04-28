// src/services/scrapers/scrapeSubito.ts
import type { ListingItem } from '../../types';
import axios from 'axios';
import { load } from 'cheerio';

const ITEMS_PER_PAGE = 20;

export async function scrapeSubito(
  query: string,
  page: number = 1
): Promise<ListingItem[]> {
  console.log(`🚀 [scrapeSubito] start for query="${query}", page=${page}`);

  const offset = (page - 1) * ITEMS_PER_PAGE;
  const baseUrl = 'https://www.subito.it/annunci-italia/vendita/usato/';
  const url     = `${baseUrl}?q=${encodeURIComponent(query)}&o=${offset}`;

  console.log(`📡 [scrapeSubito] fetching URL: ${url}`);
  const headers = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
      'AppleWebKit/537.36 (KHTML, like Gecko) ' +
      'Chrome/115.0.0.0 Safari/537.36',
    'Accept-Language': 'it-IT,it;q=0.9,en-US;q=0.8',
  };

  let html: string;
  try {
    const resp = await axios.get<string>(url, { headers, timeout: 60000 });
    html = resp.data;
  } catch (err) {
    console.error('❌ [scrapeSubito] axios GET failed:', err);
    return [];
  }

  // Carica l'HTML e prendi lo script __NEXT_DATA__
  const $ = load(html);
  const script = $('#__NEXT_DATA__').html();
  if (!script) {
    console.warn('⚠️ [scrapeSubito] __NEXT_DATA__ non trovato');
    return [];
  }

  let nextData: any;
  try {
    nextData = JSON.parse(script);
  } catch (err) {
    console.error('❌ [scrapeSubito] parsing JSON __NEXT_DATA__ fallito:', err);
    return [];
  }

  // Individua l'array di annunci dentro il JSON
  // Controlla la struttura effettiva con un console.log(nextData)
  const pageProps = nextData.props?.pageProps || {};
  let ads: any[] = [];

  if (Array.isArray(pageProps.initialAds)) {
    ads = pageProps.initialAds;
  } else if (pageProps.ads?.results) {
    ads = pageProps.ads.results;
  } else if (pageProps.searchResults?.results) {
    ads = pageProps.searchResults.results;
  } else {
    console.warn('⚠️ [scrapeSubito] non ho trovato l’array di annunci in __NEXT_DATA__');
    return [];
  }

  // Mappa l'array raw in ListingItem[]
  const items: ListingItem[] = ads.map((ad: any) => {
    // Prezzo può essere stringa "€123" o oggetto { amount, currency }
    let price = 0;
    if (typeof ad.price === 'string') {
      price = parseFloat(ad.price.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
    } else if (typeof ad.price === 'object' && ad.price.amount) {
      price = Number(ad.price.amount) || 0;
    }

    // URL e immagini
    const link = typeof ad.link === 'string' ? ad.link : ad.link?.url || '';
    const itemUrl = link.startsWith('http') ? link : `https://www.subito.it${link}`;
    const imageUrl =
      (ad.images && ad.images.length && ad.images[0].url) ||
      ad.image ||
      '';

    return {
      id:          ad.id ?? itemUrl,
      title:       ad.title ?? '',
      description: ad.description ?? '',
      price,
      imageUrl,
      url:         itemUrl,
      source:      'subito',
      location:    ad.city ?? ad.location ?? '',
      date:        ad.date ? new Date(ad.date).getTime() : Date.now(),
    };
  });

  console.log(`✅ [scrapeSubito] found ${items.length} items`);
  return items;
}
