// api/search.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { scrapeSubito }     from '../src/services/scrapers/scrapeSubito';
import { scrapeEbay }       from '../src/services/scrapers/scrapeEbay';
import { scrapeLeboncoin }  from '../src/services/scrapers/scrapeLeboncoin';
import { scrapeWallapop }   from '../src/services/scrapers/scrapeWallapop';
import type { ListingItem } from '../src/types';

const MAX_PER_PAGE = 20;

// Round-robin interleaving di N array
function interleaveMany<T>(arrays: T[][]): T[] {
  const result: T[] = [];
  const maxLen = Math.max(...arrays.map(a => a.length));
  for (let i = 0; i < maxLen; i++) {
    for (const arr of arrays) {
      if (arr[i]) result.push(arr[i]);
    }
  }
  return result;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('🔔 [api/search] invoked with', req.query);
  const q           = (req.query.q as string) || '';
  const page        = parseInt(req.query.page as string) || 1;
  const marketplace = (req.query.marketplace as string) || 'all';

  if (!q) {
    return res.status(400).json({ error: 'Missing query' });
  }

  try {
    const [subitoRes, ebayRes, lbcRes, wallaRes] = await Promise.allSettled([
      scrapeSubito(q, page),
      scrapeEbay(q),
      scrapeLeboncoin(q, page),
      scrapeWallapop(q, page),
    ]);

    const subitoItems: ListingItem[] =
      subitoRes.status === 'fulfilled'
        ? subitoRes.value
        : (console.error('❌ scrapeSubito failed:', subitoRes.reason), []);

    const ebayItems: ListingItem[] =
      ebayRes.status === 'fulfilled'
        ? ebayRes.value
        : (console.error('❌ scrapeEbay failed:', ebayRes.reason), []);

    const lbcItems: ListingItem[] =
      lbcRes.status === 'fulfilled'
        ? lbcRes.value
        : (console.error('❌ scrapeLeboncoin failed:', lbcRes.reason), []);

    const wallapopItems: ListingItem[] =
      wallaRes.status === 'fulfilled'
        ? wallaRes.value
        : (console.error('❌ scrapeWallapop failed:', wallaRes.reason), []);

    // Mescola round-robin
    let allItems = interleaveMany([
      subitoItems,
      ebayItems,
      lbcItems,
      wallapopItems
    ]);

    // Filtro per marketplace
    if (marketplace !== 'all') {
      allItems = allItems.filter(item => item.source === marketplace);
    }

    // Paginazione
    const items   = allItems.slice(0, MAX_PER_PAGE);
    const hasMore = allItems.length > MAX_PER_PAGE;

    // Caching edge-friendly
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    console.log(`📦 Returning ${items.length} items (hasMore=${hasMore})`);
    return res.status(200).json({ items, hasMore });
  } catch (err) {
    console.error('❌ [api/search] unexpected error:', err);
    return res.status(500).json({ error: 'Search failed' });
  }
}
