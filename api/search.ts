// api/search.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { scrapeSubito } from '../src/services/scrapers/scrapeSubito';
import { scrapeEbay } from '../src/services/scrapers/scrapeEbay';
import type { ListingItem } from '../src/types';

const MAX_PER_PAGE = 20;

function interleaveArrays<T>(a: T[], b: T[]): T[] {
  const result: T[] = [];
  const maxLen = Math.max(a.length, b.length);
  for (let i = 0; i < maxLen; i++) {
    if (a[i]) result.push(a[i]);
    if (b[i]) result.push(b[i]);
  }
  return result;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('🔔 [api/search] invoked with', req.query);
  const q = (req.query.q as string) || '';
  const page = parseInt(req.query.page as string) || 1;

  if (!q) {
    return res.status(400).json({ error: 'Missing query' });
  }

  try {
    // Passa `page` anche a scrapeSubito per l'offset
    const [subitoRes, ebayRes] = await Promise.allSettled([
      scrapeSubito(q, page),
      scrapeEbay(q),
    ]);

    const subitoItems: ListingItem[] = subitoRes.status === 'fulfilled'
      ? subitoRes.value
      : (console.error('❌ scrapeSubito failed:', subitoRes.reason), []);

    const ebayItems: ListingItem[] = ebayRes.status === 'fulfilled'
      ? ebayRes.value
      : (console.error('❌ scrapeEbay failed:', ebayRes.reason), []);

    // Mescola round-robin fra Subito ed eBay
    const all = interleaveArrays(subitoItems, ebayItems);

    // Paginazione globale (ma ogni scraper già scorre la pagina sua)
    const start = 0;
    const items = all.slice(start, MAX_PER_PAGE);
    const hasMore = subitoItems.length === ITEMS_PER_PAGE || ebayItems.length === ITEMS_PER_PAGE;

    console.log(`📦 Returning ${items.length} items (hasMore=${hasMore})`);

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    return res.status(200).json({ items, hasMore });
  } catch (err) {
    console.error('❌ [api/search] unexpected error:', err);
    return res.status(500).json({ error: 'Search failed' });
  }
}
