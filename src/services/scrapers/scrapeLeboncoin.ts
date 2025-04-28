// src/services/scrapers/scrapeLeboncoin.ts

import type { ListingItem } from '../../types';
import axios from 'axios';
import { load } from 'cheerio';
import chromium from 'chrome-aws-lambda';
import puppeteer from 'puppeteer-core';

const ITEMS_PER_PAGE = 30;

// Aggiunge https se serve
function addScheme(url: string): string {
  if (!url) return url;
  if (url.startsWith('//')) return 'https:' + url;
  if (!/^https?:\/\//.test(url)) return 'https://' + url;
  return url;
}

// Cerca l’array di ads in __NEXT_DATA__
function findAds(obj: any): any[] | null {
  if (Array.isArray(obj) && obj[0]?.id && obj[0]?.title) return obj;
  if (obj && typeof obj === 'object') {
    for (const k of Object.keys(obj)) {
      const found = findAds(obj[k]);
      if (found) return found;
    }
  }
  return null;
}

// Mappa un annuncio raw in ListingItem
function mapAd(raw: any): ListingItem {
  const title = raw.title || '';
  let price = 0;
  if (typeof raw.price === 'number') price = raw.price;
  else if (raw.price?.value) price = Number(raw.price.value) || 0;
  else if (typeof raw.price === 'string')
    price = parseFloat(raw.price.replace(/[^
\d.,]/g, '').replace(',', '.')) || 0;

  const path = raw.uri || raw.url || raw.link || '';
  const url  = path.startsWith('http') ? path : `https://www.leboncoin.fr${path}`;
  const imageUrl = raw.images?.[0] || raw.pictures?.[0]?.url || '';
  const location = raw.location?.city || '';

  let date = Date.now();
  if (raw.creation_date) date = new Date(raw.creation_date).getTime();
  else if (raw.sort_date) date = new Date(raw.sort_date).getTime();

  return {
    id:          url,
    title,
    description: raw.description || '',
    price,
    imageUrl:    imageUrl,
    url,
    source:      'leboncoin',
    location,
    date
  };
}

export async function scrapeLeboncoin(query: string, page = 1): Promise<ListingItem[]> {
  console.log(`🚀 [scrapeLeboncoin] "${query}", page=${page}`);
  const searchUrl = `https://www.leboncoin.fr/recherche?text=${encodeURIComponent(query)}&page=${page}`;
  let html: string;

  // 1) Provo JSON con axios
  try {
    const resp = await axios.get<string>(searchUrl, {
      headers: {
        'User-Agent':      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' + 
                           'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8'
      },
      timeout: 60000
    });
    html = resp.data;
  } catch {
    console.warn('⚠️ JSON blocked → fallback headless');
    // 2) fallback headless con chrome-aws-lambda o puppeteer-core
    try {
      const exePath = await chromium.executablePath;
      const launchOptions = {
        args:            chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath:  exePath || undefined,
        headless:        chromium.headless
      };
      const browser = exePath
        ? await chromium.puppeteer.launch(launchOptions)
        : await puppeteer.launch({ headless: true });

      const pg = await browser.newPage();
      await pg.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
                            'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36');
      await pg.setExtraHTTPHeaders({ 'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8' });
      await pg.goto(searchUrl, { waitUntil: 'networkidle2' });
      html = await pg.content();
      await browser.close();
    } catch (err) {
      console.error('❌ headless error:', err);
      return [];
    }
  }

  const $ = load(html);

  // ─── JSON PARSING ───────────────────────────
  const script = $('script#__NEXT_DATA__').html();
  if (script) {
    try {
      const data = JSON.parse(script);
      const ads  = findAds(data);
      if (ads?.length) {
        const items = ads.map(mapAd);
        console.log(`✅ JSON-based: ${items.length} items`);
        return items;
      }
      console.warn('⚠️ JSON-based zero items');
    } catch (e) {
      console.error('❌ JSON parse failed', e);
    }
  } else {
    console.warn('⚠️ no __NEXT_DATA__');
  }

  // ─── HTML FALLBACK ───────────────────────────
  console.warn('⚠️ using HTML fallback selectors');
  const results: ListingItem[] = [];
  $('section.mainList ul li a.list_item').each((_, el) => {
    const e         = $(el);
    const href      = addScheme(e.attr('href') || '');
    const title     = e.find('section.item_infos h2.item_title').text().trim();
    const priceText = e.find('section.item_infos h3.item_price').text();
    const price     = parseFloat(priceText.replace(/[^
\d.,]/g, '').replace(',', '.')) || 0;
    const imgUrl    = addScheme(e.find('div.item_imagePic span').attr('data-imgsrc') || '');

    results.push({
      id:          href,
      title,
      description: '',
      price,
      imageUrl:    imgUrl,
      url:         href,
      source:      'leboncoin',
      location:    '',
      date:        Date.now()
    });
  });
  console.log(`✅ HTML fallback: ${results.length} items`);
  return results;
}
