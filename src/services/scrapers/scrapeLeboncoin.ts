// src/services/scrapers/scrapeLeboncoin.ts

import type { ListingItem } from '../../types';
import axios from 'axios';
import { load } from 'cheerio';
import chromium from 'chrome-aws-lambda';
import puppeteer from 'puppeteer';

const ITEMS_PER_PAGE = 30;

/** Cerca un array di annunci in un oggetto JSON nested */
function findAdsArray(obj: any): any[] | null {
  if (Array.isArray(obj) && obj.length > 0 && typeof obj[0] === 'object') {
    const keys = Object.keys(obj[0]);
    if (keys.includes('id') && keys.includes('title')) return obj;
  }
  if (obj && typeof obj === 'object') {
    for (const k of Object.keys(obj)) {
      const found = findAdsArray(obj[k]);
      if (found) return found;
    }
  }
  return null;
}

/** Mappa il JSON di Leboncoin in ListingItem */
function mapJsonAdToItem(ad: any): ListingItem {
  const title       = ad.title || '';
  const description = ad.description || '';
  let price         = 0;
  if (typeof ad.price === 'number') price = ad.price;
  else if (ad.price?.value) price = Number(ad.price.value) || 0;
  else if (typeof ad.price === 'string')
    price = parseFloat(ad.price.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;

  const linkPath = ad.uri || ad.url || ad.link || '';
  const url      = linkPath.startsWith('http')
                   ? linkPath
                   : `https://www.leboncoin.fr${linkPath}`;

  const imageUrl = (ad.images && ad.images[0]) ||
                   (ad.pictures && ad.pictures[0]?.url) ||
                   '';

  const location = ad.location?.city || ad.city || '';
  let date       = Date.now();
  if (ad.creation_date) date = new Date(ad.creation_date).getTime();
  else if (ad.sort_date) date = new Date(ad.sort_date).getTime();

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
 * scrapeLeboncoin: JSON-first con axios, poi headless browser, poi HTML fallback.
 */
export async function scrapeLeboncoin(
  query: string,
  page: number = 1
): Promise<ListingItem[]> {
  console.log(`🚀 [scrapeLeboncoin] query="${query}", page=${page}`);
  const searchUrl = `https://www.leboncoin.fr/recherche?text=${encodeURIComponent(query)}&page=${page}`;

  let html: string;

  // 1) Prova JSON-based tramite axios
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
    console.warn('⚠️ [scrapeLeboncoin] axios 403, uso headless browser');
    // 2) Headless browser: puppeteer in locale, chrome-aws-lambda in prod
    try {
      let browser;
      if (process.env.AWS_LAMBDA_FUNCTION_VERSION) {
        // Produzione su Vercel/AWS Lambda
        const exePath = await chromium.executablePath;
        browser = await chromium.puppeteer.launch({
          args: chromium.args,
          defaultViewport: chromium.defaultViewport,
          executablePath: exePath,
          headless: chromium.headless,
        });
      } else {
        // Locale: usa puppeteer con Chromium bundlato
        browser = await puppeteer.launch({ headless: true });
      }

      const pageP = await browser.newPage();
      await pageP.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
                               'AppleWebKit/537.36 (KHTML, like Gecko) ' +
                               'Chrome/115.0.0.0 Safari/537.36');
      await pageP.setExtraHTTPHeaders({ 'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8' });
      await pageP.goto(searchUrl, { waitUntil: 'networkidle2' });
      html = await pageP.content();
      await browser.close();
    } catch (puppErr) {
      console.error('❌ [scrapeLeboncoin] errore headless browser:', puppErr);
      // 3) Se anche questo fallisce, restituisci array vuoto
      return [];
    }
  }

  // Parsiamo con Cheerio
  const $ = load(html);

  // ─── JSON‐BASED SCRAPING ───────────────────────────────────────────────
  const script = $('script#__NEXT_DATA__').html();
  if (script) {
    try {
      const nextData = JSON.parse(script);
      const adsArray = findAdsArray(nextData);
      if (adsArray && adsArray.length > 0) {
        const items = adsArray.map(mapJsonAdToItem);
        console.log(`✅ JSON-based trovato ${items.length} item`);
        return items;
      }
      console.warn('⚠️ JSON-based ha restituito 0 elementi');
    } catch (err) {
      console.error('❌ parsing JSON fallito:', err);
    }
  } else {
    console.warn('⚠️ __NEXT_DATA__ non trovato');
  }

  // ─── HTML FALLBACK SCRAPING ───────────────────────────────────────────
  console.warn('⚠️ uso HTML fallback');
  const listings: ListingItem[] = [];

  $('li[itemtype="http://schema.org/Offer"]').each((_, el) => {
    const el$   = $(el);
    const id    = el$.find('div.saveAd').attr('data-savead-id') || '';
    let href    = el$.find('a').first().attr('href') || '';
    if (!href.startsWith('http')) href = `https:${href}`;

    const title   = el$.find('section.item_infos > h2').text().trim();
    let priceText = el$.find('div.price').text().trim();
    if (!priceText) priceText = el$.find('h3.item_price').attr('content') || '';
    const price   = parseFloat(priceText.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;

    const imageUrl = el$.find('img').attr('src') || '';
    const address  = el$.find('p[itemtype="http://schema.org/Place"]').text().trim();
    const date     = Date.now();

    listings.push({
      id:          id || href,
      title,
      description: '',
      price,
      imageUrl,
      url:          href,
      source:       'leboncoin',
      location:     address,
      date,
    });
  });

  console.log(`✅ HTML fallback trovato ${listings.length} item`);
  return listings;
}
