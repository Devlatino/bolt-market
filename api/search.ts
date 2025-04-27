import type { VercelRequest, VercelResponse } from '@vercel/node';
import { scrapeSubito } from '../src/services/scrapers/scrapeSubito';
import { scrapeEbay }   from '../src/services/scrapers/scrapeEbay';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const q = (req.query.q as string) ?? '';
  if (!q) return res.status(400).json({ error: 'Missing query' });

  try {
    const [subito, ebay] = await Promise.all([
      scrapeSubito(q),
      scrapeEbay(q),
    ]);

    const all = [...subito, ...ebay].sort((a, b) => a.price - b.price);
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
  const page = parseInt(req.query.page as string) || 1;
  const hasMore = false;
  res.status(200).json({ items: all, hasMore });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Search failed' });
  }
}
