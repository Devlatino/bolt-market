/* src/services/scrapers/scrapeLeboncoin.ts */
import type { ListingItem } from '../../types';
import chromium from 'chrome-aws-lambda';
import puppeteer from 'puppeteer';   // ← usa puppeteer pieno in fallback

const ITEMS_PER_PAGE = 30;

export async function scrapeLeboncoin(query: string, page = 1): Promise<ListingItem[]> {
  // Percorso di chrome-aws-lambda su Vercel
  const exePath = await chromium.executablePath;
  const launchOptions = {
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: exePath || undefined,
    headless: chromium.headless,
  };

  // Se siamo in Vercel, uso chromium; altrimenti fallback a puppeteer
  const browser = exePath
    ? await chromium.puppeteer.launch(launchOptions)
    : await puppeteer.launch(launchOptions);

  const pageCtx = await browser.newPage();

  // Imposta un User-Agent “reale” e lingua
  await pageCtx.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
    'AppleWebKit/537.36 (KHTML, like Gecko) ' +
    'Chrome/115.0.0.0 Safari/537.36'
  );
  await pageCtx.setExtraHTTPHeaders({
    'Accept-Language': 'fr-FR,fr;q=0.9'
  });

  // Prima visita per generare cookie / bypassare Datadome
  await pageCtx.goto('https://www.leboncoin.fr/', { waitUntil: 'networkidle2' });
  await pageCtx.waitForTimeout(2000);

  // Chiamata all’API interna
  const apiUrl = `https://api.leboncoin.fr/finder/search?text=${encodeURIComponent(query)}&page=${page}&limit=${ITEMS_PER_PAGE}`;
  const resp = await pageCtx.evaluate(async (url: string) => {
    const r = await fetch(url, { credentials: 'include' });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  }, apiUrl);

  await browser.close();

  const rawAds: any[] = resp.ads || [];
  return rawAds.map((ad) => {
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
