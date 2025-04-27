import { scrapeSubito } from '../src/services/scrapers/scrapeSubito';
import { scrapeEbay } from '../src/services/scrapers/scrapeEbay';

// Costanti
const ITEMS_PER_PAGE = 20;

// Interleave arrays a round-robin mix
function interleave(arrays) {
  const maxLen = Math.max(...arrays.map(a => a.length));
  const merged = [];
  for (let i = 0; i < maxLen; i++) {
    for (const arr of arrays) {
      if (arr[i]) merged.push(arr[i]);
    }
  }
  return merged;
}

export default async function handler(req, res) {
  const { q, page = 1, priceMin, priceMax, marketplace } = req.query;
  console.log('[api/search] invoked with', req.query);

  // Fetch da tutti i marketplace
  const [subitoItems, ebayItems] = await Promise.all([
    scrapeSubito(q, Number(page)),
    scrapeEbay(q, Number(page)),
  ]);

  // Mix risultati
  let all = interleave([subitoItems, ebayItems]);

  // Filtri eventuali (prezzo, source)
  if (priceMin) all = all.filter(i => i.price >= Number(priceMin));
  if (priceMax) all = all.filter(i => i.price <= Number(priceMax));
  if (marketplace && marketplace !== 'all') all = all.filter(i => i.source === marketplace);

  const start = (Number(page) - 1) * ITEMS_PER_PAGE;
  const paged = all.slice(start, start + ITEMS_PER_PAGE);
  const hasMore = all.length > start + ITEMS_PER_PAGE;

  console.log(`📦 Returning ${paged.length} items (hasMore=${hasMore})`);
  res.status(200).json({ items: paged, hasMore });
}