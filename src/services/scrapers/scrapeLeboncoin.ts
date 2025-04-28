// src/services/scrapers/scrapeLeboncoin.ts

import type { ListingItem } from '../../types';
import axios from 'axios';
import { load } from 'cheerio';
import chromium from 'chrome-aws-lambda';

const ITEMS_PER_PAGE = 30;

/** Aggiunge lo “https:” se manca lo schema */
function addSchemeIfMissing(url: string): string {
  if (!url) return url;
  if (url.startsWith('//')) return 'https:' + url;
  if (!url.match(/^https?:\/\//)) return 'https://' + url;
  return url;
}

/** Cerca array di annunci in un JSON nested (Next.js __NEXT_DATA__) */
function findAdsArray(obj: any): any[] | null {
  if (Array.isArray(obj) && obj.length && typeof obj[0] === 'object') {
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

/** Mappa un annuncio JSON in ListingItem */
function mapJsonAdToItem(ad: any): ListingItem {
  const title       = ad.title || '';
  const description = ad.description || '';
  let price         = 0;
  if (typeof ad.price === 'number') price = ad.price;
  else if (ad.price?.value)      price = Number(ad.price.value) || 0;
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

  return { id: url, title, description, price, imageUrl, url, source: 'leboncoin', location, date };
}

/**
 * scrapeLeboncoin: JSON-first con axios, poi headless con chromium.puppeteer, poi HTML fallback in stile Scrapy.
 */
export async function scrapeLeboncoin(
  query: string,
  page: number = 1
): Promise<ListingItem[]> {
  console.log(`🚀 [scrapeLeboncoin] query="${query}", page=${page}`);
  const searchUrl = `https://www.leboncoin.fr/recherche?text=${encodeURIComponent(query)}&page=${page}`;
  let html: string;

  // 1) Prova JSON-based con axios
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
    console.warn('⚠️ [scrapeLeboncoin] JSON 403, uso chromium.puppeteer fallback');
    // 2) Headless browser con chrome-aws-lambda
    try {
      const exePath = await chromium.executablePath;
      const browser = await chromium.puppeteer.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: exePath,
        headless: chromium.headless,
      });
      const pageP = await browser.newPage();
      await pageP.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
                               'AppleWebKit/537.36 (KHTML, like Gecko) ' +
                               'Chrome/115.0.0.0 Safari/537.36');
      await pageP.setExtraHTTPHeaders({ 'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8' });
      await pageP.goto(searchUrl, { waitUntil: 'networkidle2' });
      html = await pageP.content();
      await browser.close();
    } catch (browserErr) {
      console.error('❌ [scrapeLeboncoin] errore headless browser:', browserErr);
      return [];
    }
  }

  const $ = load(html);

  // ─── JSON‐BASED SCRAPING ───────────────────────────────────────────────
  const script = $('script#__NEXT_DATA__').html();
  if (script) {
    try {
      const nextData = JSON.parse(script);
      const adsArray = findAdsArray(nextData);
      if (adsArray && adsArray.length) {
        const items = adsArray.map(mapJsonAdToItem);
        console.log(`✅ [scrapeLeboncoin] JSON-based trovato ${items.length} item`);
        return items;
      }
      console.warn('⚠️ [scrapeLeboncoin] JSON-based ha restituito 0 elementi');
    } catch (e) {
      console.error('❌ [scrapeLeboncoin] parsing JSON fallito:', e);
    }
  } else {
    console.warn('⚠️ [scrapeLeboncoin] __NEXT_DATA__ non trovato');
  }

  // ─── HTML FALLBACK (ispirato a andremiras-lbcscraper) ────────────────
  console.warn('⚠️ [scrapeLeboncoin] uso HTML fallback “list_item” selector');
  const listings: ListingItem[] = [];

  $('section.mainList ul li a.list_item').each((_, el) => {
    const el$       = $(el);
    const rawLink   = el$.attr('href') || '';
    const link      = addSchemeIfMissing(rawLink);
    const title     = el$.find('section.item_infos h2.item_title').text().trim();
    const priceStr  = el$.find('section.item_infos h3.item_price').text().trim();
    const price     = parseFloat(priceStr.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
    const photoRaw  = el$.find('div.item_imagePic span').attr('data-imgsrc') || '';
    const photo     = addSchemeIfMissing(photoRaw);

    listings.push({
      id:          link,
      title,
      description: '',
      price,
      imageUrl:    photo,
      url:         link,
      source:      'leboncoin',
      location:     '',
      date:         Date.now(),
    });
  });

  console.log(`✅ [scrapeLeboncoin] HTML fallback trovato ${listings.length} item`);
  return listings;
}
