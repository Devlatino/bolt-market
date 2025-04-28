// src/services/scrapers/scrapeLeboncoin.ts

import type { ListingItem } from '../../types';
import axios from 'axios';
import { load } from 'cheerio';
import chromium from 'chrome-aws-lambda';
import puppeteer from 'puppeteer-core';

const ITEMS_PER_PAGE = 30;

/** Cerca ricorsivamente un array di “ad” nel JSON di __NEXT_DATA__ */
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

/** Mappa un oggetto JSON di Leboncoin in ListingItem */
function mapJsonAdToItem(ad: any): ListingItem {
  const title       = ad.title || '';
  const description = ad.description || '';
  let price         = 0;
  if (typeof ad.price === 'number') {
    price = ad.price;
  } else if (ad.price?.value) {
    price = Number(ad.price.value) || 0;
  } else if (typeof ad.price === 'string') {
    price = parseFloat(ad.price.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
  }
  const linkPath = ad.uri || ad.url || ad.link || '';
  const url      = linkPath.startsWith('http')
                   ? linkPath
                   : `https://www.leboncoin.fr${linkPath}`;
  const imageUrl = (ad.images && ad.images[0]) ||
                   (ad.pictures && ad.pictures[0]?.url) ||
                   '';
  const location = ad.location?.city || ad.city || '';
  let date       = Date.now();
  if (ad.creation_date) {
    date = new Date(ad.creation_date).getTime();
  } else if (ad.sort_date) {
    date = new Date(ad.sort_date).getTime();
  }

  return {
    id:          url,
    title,
    description,
    price,
    imageUrl,
    url,
    source:      'leboncoin',
    location,
    date,
  };
}

/**
 * scrapeLeboncoin: tenta prima l’API JSON, poi fallback Puppeteer + HTML scraping
 */
export async function scrapeLeboncoin(
  query: string,
  page: number = 1
): Promise<ListingItem[]> {
  console.log(`🚀 [scrapeLeboncoin] query="${query}", page=${page}`);
  const searchUrl = `https://www.leboncoin.fr/recherche?text=${encodeURIComponent(query)}&page=${page}`;

  let html: string;
  let useBrowser = false;

  // 1) Prova con axios
  try {
    const resp = await axios.get<string>(searchUrl, {
      headers: {
        'User-Agent':      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
                           'AppleWebKit/537.36 (KHTML, like Gecko) ' +
                           'Chrome/115.0.0.0 Safari/537.36',
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8',
      },
      timeout: 60000,
    });
    html = resp.data;
  } catch (err) {
    console.warn('⚠️ [scrapeLeboncoin] axios GET failed, user-agent o bot detection:', err);
    useBrowser = true;
  }

  // 2) Fallback Puppeteer in caso di 403
  if (useBrowser) {
    const exePath = await chromium.executablePath;
    const browser = await (exePath
      ? chromium.puppeteer.launch({
          args: chromium.args,
          defaultViewport: chromium.defaultViewport,
          executablePath: exePath,
          headless: chromium.headless,
        })
      : puppeteer.launch({ headless: true }));

    const pageP = await browser.newPage();
    await pageP.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
                             'AppleWebKit/537.36 (KHTML, like Gecko) ' +
                             'Chrome/115.0.0.0 Safari/537.36');
    await pageP.setExtraHTTPHeaders({ 'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8' });
    await pageP.goto(searchUrl, { waitUntil: 'networkidle2' });
    html = await pageP.content();
    await browser.close();
  }

  const $ = load(html);
  // ─── JSON‐BASED SCRAPING ───────────────────────────────────────────────
  const script = $('script#__NEXT_DATA__').html();
  if (script) {
    try {
      const nextData = JSON.parse(script);
      const adsArray = findAdsArray(nextData);
      if (adsArray && adsArray.length > 0) {
        const items = adsArray.map(mapJsonAdToItem);
        console.log(`✅ [scrapeLeboncoin] JSON-based trovato ${items.length} item`);
        return items;
      }
      console.warn('⚠️ [scrapeLeboncoin] JSON-based ha restituito 0 elementi');
    } catch (err) {
      console.error('❌ [scrapeLeboncoin] parsing JSON failed:', err);
    }
  } else {
    console.warn('⚠️ [scrapeLeboncoin] __NEXT_DATA__ non trovato');
  }

  // ─── FALLBACK HTML SCRAPING (ispirato a Scrapy spider) ────────────────
  console.warn('⚠️ [scrapeLeboncoin] uso HTML fallback con selectors schema.org');
  const listings: ListingItem[] = [];

  // Se ogni annuncio è un <li itemtype="http://schema.org/Offer">
  $('li[itemtype="http://schema.org/Offer"]').each((_, el) => {
    const el$ = $(el);

    // ID univoco
    const saveAd = el$.find('div.saveAd');
    const htmlId = saveAd.attr('data-savead-id') || '';

    // URL
    let href = el$.find('a').first().attr('href') || '';
    if (!href.startsWith('http')) href = `https:${href}`;

    // Titolo
    const title = el$.find('section.item_infos > h2').text().trim();

    // Prezzo
    let priceText = el$.find('div.price').text().trim();
    if (!priceText) {
      priceText = el$.find('h3.item_price').attr('content') || '';
    }
    const price = parseFloat(priceText.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;

    // Immagine
    const imageUrl = el$.find('img').attr('src') || '';

    // Indirizzo
    const address = el$.find('p[itemtype="http://schema.org/Place"]').text().trim();

    // Data (non disponibile, uso timestamp)
    const date = Date.now();

    listings.push({
      id:          htmlId || href,
      title,
      description: '', // il dettaglio viene caricato altrove
      price,
      imageUrl,
      url:          href,
      source:       'leboncoin',
      location:     address,
      date,
    });
  });

  console.log(`✅ [scrapeLeboncoin] HTML fallback trovato ${listings.length} item`);
  return listings;
}
