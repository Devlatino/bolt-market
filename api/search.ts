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
    const [subitoRes, ebayRes] = await Promise.allSettled([
      scrapeSubito(q, page),
      scrapeEbay(q),
    ]);

    const subitoItems: ListingItem[] =
      subitoRes.status === 'fulfilled'
        ? subitoRes.value
        : (console.error('❌ scrapeSubito failed:', subitoRes.reason), []);

    const ebayItems: ListingItem[] =
      ebayRes.status === 'fulfilled'
        ? ebayRes.value
        : (console.error('❌ scrapeEbay failed:', ebayRes.reason), []);

    // Mescola round-robin
    const all = interleaveArrays(subitoItems, ebayItems);

    // Prendi i primi MAX_PER_PAGE
    const items = all.slice(0, MAX_PER_PAGE);

    // Se uno dei due ha almeno MAX_PER_PAGE risultati, c'è ancora un'altra pagina
    const hasMore =
      subitoItems.length >= MAX_PER_PAGE || ebayItems.length >= MAX_PER_PAGE;

    console.log(`📦 Returning ${items.length} items (hasMore=${hasMore})`);

    // caching edge-friendly
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    return res.status(200).json({ items, hasMore });
  } catch (err) {
    console.error('❌ [api/search] unexpected error:', err);
    return res.status(500).json({ error: 'Search failed' });
  }
}
