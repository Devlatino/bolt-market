// src/services/scrapers/scrapeWallapop.ts
import type { ListingItem } from '../../types';
import chromium from 'chrome-aws-lambda';

const ITEMS_SELECTOR = 'article[data-testid="card"]';
const ITEM_TITLE    = 'h3[data-testid="title"]';
const ITEM_PRICE    = 'span[data-testid="price"]';
const ITEM_IMG      = 'img[data-testid="picture"]';
const ITEM_LINK     = 'a[data-testid="card-link"]';

export async function scrapeWallapop(query: string, page = 1): Promise<ListingItem[]> {
  console.log(`🚀 [scrapeWallapop] start for query="${query}", page=${page}`);
  const offset = (page - 1) * 20;
  const searchUrl = `https://es.wallapop.com/app/search?searchTerm=${encodeURIComponent(query)}&orderBy=creation_time&offset=${offset}`;

  // Avvia Chromium headless (chrome-aws-lambda)
  const browser = await chromium.puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath || undefined,
    headless: chromium.headless,
  });

  const pageCtx = await browser.newPage();
  // User-Agent real-world per evitare blocchi
  await pageCtx.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
    'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
  );
  await pageCtx.goto(searchUrl, { waitUntil: 'networkidle2' });
  await pageCtx.waitForSelector(ITEMS_SELECTOR, { timeout: 60000 });

  // Estrai dati dal DOM
  const items = await pageCtx.$$eval(
    ITEMS_SELECTOR,
    (cards, selectors) => {
      const { ITEM_TITLE, ITEM_PRICE, ITEM_IMG, ITEM_LINK } = selectors as any;
      return (cards as HTMLElement[]).map(card => {
        const titleEl = card.querySelector(ITEM_TITLE) as HTMLElement;
        const priceEl = card.querySelector(ITEM_PRICE) as HTMLElement;
        const imgEl   = card.querySelector(ITEM_IMG) as HTMLImageElement;
        const linkEl  = card.querySelector(ITEM_LINK) as HTMLAnchorElement;

        const title = titleEl?.innerText.trim() || '';
        const price = parseFloat(
          (priceEl?.innerText || '')
            .replace(/[^\d.,]/g, '')
            .replace(',', '.')
        ) || 0;
        const url      = linkEl?.href || '';
        const imageUrl = imgEl?.src || '';
        const id       = url;

        return {
          id,
          title,
          description: '',
          price,
          imageUrl,
          url,
          source: 'wallapop',
          location: '',
          date: Date.now(),
        };
      });
    },
    { ITEM_TITLE, ITEM_PRICE, ITEM_IMG, ITEM_LINK }
  );

  await browser.close();
  console.log(`✅ [scrapeWallapop] found ${items.length} items`);
  return items;
}
