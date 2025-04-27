import type { VercelRequest, VercelResponse } from '@vercel/node';
import { scrapeSubito } from '../src/services/scrapers/scrapeSubito';
import { scrapeEbay } from '../src/services/scrapers/scrapeEbay';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('🔔 api/search invoked with', req.query);
  const q = (req.query.q as string) ?? '';
  if (!q) {
    return res.status(400).json({ error: 'Missing query' });
  }

  try {
    const [subito, ebay] = await Promise.all([
      scrapeSubito(q),
      scrapeEbay(q),
    ]);
    const all = [...subito, ...ebay].sort((a, b) => a.price - b.price);

    // Pagination
    const page    = parseInt(req.query.page as string) || 1;
    const perPage = 20;  // scegli tu il size desiderato
    const start   = (page - 1) * perPage;
    const items   = all.slice(start, start + perPage);
    const hasMore = all.length > page * perPage;

    // Caching edge‐friendly
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    return res.status(200).json({ items, hasMore });
  } catch (err) {
    console.error('❌ search.ts catch error:', err);
    return res.status(500).json({ error: 'Search failed' });
  }
}
