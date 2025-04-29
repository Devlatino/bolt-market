/* src/services/scrapers/scrapeWallapop.ts */
import type { ListingItem } from '../../types';
import chromium from 'chrome-aws-lambda';
import puppeteer from 'puppeteer';   // ← serve per simulare un browser "vero"

export async function scrapeWallapop(query: string, page = 1): Promise<ListingItem[]> {
  const exePath = await chromium.executablePath;
  const browser = exePath
    ? await chromium.puppeteer.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: exePath,
        headless: chromium.headless,
      })
    : await puppeteer.launch({ headless: true });

  const pageCtx = await browser.newPage();

  // 1) Carica la pagina di ricerca per generare cookie e token
  await pageCtx.goto(
    `https://www.wallapop.com/search?keywords=${encodeURIComponent(query)}`,
    { waitUntil: 'networkidle2' }
  );

  // 2) Intercetta la chiamata XHR all’API interna
  const resp = await pageCtx.evaluate(async () => {
    const params = new URLSearchParams({ keywords: (new URLSearchParams(window.location.search)).get('keywords') || '' });
    const apiUrl = `${window.location.origin}/api/v3/general/search?${params.toString()}&order_by=creation_time&offset=0&limit=20`;
    const r = await fetch(apiUrl, { credentials: 'include' });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  });

  await browser.close();

  const rawAds: any[] = resp.search_objects || [];
  return rawAds.map((ad) => {
    const uri = ad.uri || ad.link || '';
    const url = uri.startsWith('http') ? uri : `https://www.wallapop.com${uri}`;
    const price = ad.price?.amount
      ? Number(ad.price.amount)
      : parseFloat(ad.price) || 0;

    return {
      id: ad.id || url,
      title: ad.title || '',
      description: ad.description || '',
      price,
      imageUrl: ad.images?.[0]?.url || '',
      url,
      source: 'wallapop',
      location: ad.location?.city || '',
      date: ad.creationTime ? Date.parse(ad.creationTime) : Date.now()
    };
  });
}
