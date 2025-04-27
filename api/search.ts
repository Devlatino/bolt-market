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
  if (!q) return res.status(400).json({ error: 'Missing query' });

  try {
    const [subitoRes, ebayRes] = await Promise.allSettled([
      scrapeSubito(q),
      scrapeEbay(q),
    ]);

    const subitoItems: ListingItem[] = subitoRes.status === 'fulfilled'
      ? subitoRes.value
      : (console.error('❌ scrapeSubito failed:', subitoRes), []);

    const ebayItems: ListingItem[] = ebayRes.status === 'fulfilled'
      ? ebayRes.value
      : (console.error('❌ scrapeEbay failed:', ebayRes), []);

    // Mescola round-robin
    const all = interleaveArrays(subitoItems, ebayItems);

    // Paginazione
    const page = parseInt(req.query.page as string) || 1;
    const start = (page - 1) * MAX_PER_PAGE;
    const items = all.slice(start, start + MAX_PER_PAGE);
    const hasMore = all.length > page * MAX_PER_PAGE;

    console.log(`📦 Returning ${items.length} items (hasMore=${hasMore})`);

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    return res.status(200).json({ items, hasMore });
  } catch (err) {
    console.error('❌ [api/search] unexpected error:', err);
    return res.status(500).json({ error: 'Search failed' });
  }
}
