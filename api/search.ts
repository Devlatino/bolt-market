// api/search.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { scrapeSubito } from '../src/services/scrapers/scrapeSubito';
import { scrapeEbay } from '../src/services/scrapers/scrapeEbay';

const MAX_PER_PAGE = 20;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('🔔 [api/search] invoked with', req.query);
  const q = (req.query.q as string) || '';
  if (!q) {
    return res.status(400).json({ error: 'Missing query' });
  }

  try {
    // Esegui entrambi gli scraper in parallelo e non fermarti se uno fallisce
    const results = await Promise.allSettled([
      scrapeSubito(q),
      scrapeEbay(q),
    ]);

    const itemsArrays: any[][] = [];
    results.forEach((r, idx) => {
      if (r.status === 'fulfilled') {
        console.log(`✅ scraper[${idx}] returned ${r.value.length} items`);
        itemsArrays.push(r.value);
      } else {
        console.error(`❌ scraper[${idx}] failed:`, r.reason);
      }
    });

    // Unisci risultati ordinati per prezzo
    const all = itemsArrays.flat().sort((a, b) => a.price - b.price);

    // Paginazione
    const page    = parseInt(req.query.page as string) || 1;
    const perPage = MAX_PER_PAGE;
    const start   = (page - 1) * perPage;
    const items   = all.slice(start, start + perPage);
    const hasMore = all.length > page * perPage;

    console.log(`📦 Returning ${items.length} items (hasMore=${hasMore})`);

    // Caching edge-friendly
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    return res.status(200).json({ items, hasMore });
  } catch (err) {
    console.error('❌ [api/search] unexpected error:', err);
    return res.status(500).json({ error: 'Search failed' });
  }
}
