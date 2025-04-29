// api/search.ts

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { scrapeSubito }     from '../src/services/scrapers/scrapeSubito';
import { scrapeEbay }       from '../src/services/scrapers/scrapeEbay';
import { scrapeLeboncoin }  from '../src/services/scrapers/scrapeLeboncoin';
import { scrapeWallapop }   from '../src/services/scrapers/scrapeWallapop';
import type { ListingItem } from '../src/types';

const MAX_PER_PAGE = 20;

/**
 * Interleave round‐robin di più array:
 * prende a turno un elemento da ciascuno fino a esaurimento.
 */
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

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  console.log('🔔 [api/search] invoked with', req.query);

  // Parametri: q=string, page=numero, marketplace=all|subito|ebay|leboncoin|wallapop
  const q           = (req.query.q as string) || '';
  const page        = parseInt(req.query.page as string) || 1;
  const marketplace = (req.query.marketplace as string) || 'all';

  if (!q) {
    return res.status(400).json({ error: 'Missing query parameter `q`' });
  }

  try {
    // Lancio tutti gli scraper in parallelo
    const [subitoRes, ebayRes, lbcRes, wallaRes] = await Promise.allSettled([
      scrapeSubito(q, page),
      scrapeEbay(q),
      scrapeLeboncoin(q, page),
      scrapeWallapop(q, page),
    ]);

    // Raccogli i risultati validi, altrimenti logga l’errore e usa array vuoto
    const subitoItems:    ListingItem[] = subitoRes.status  === 'fulfilled' ? subitoRes.value  : (console.error('❌ scrapeSubito failed:', subitoRes.reason), []);
    const ebayItems:      ListingItem[] = ebayRes.status    === 'fulfilled' ? ebayRes.value    : (console.error('❌ scrapeEbay failed:', ebayRes.reason), []);
    const lbcItems:       ListingItem[] = lbcRes.status     === 'fulfilled' ? lbcRes.value     : (console.error('❌ scrapeLeboncoin failed:', lbcRes.reason), []);
    const wallapopItems:  ListingItem[] = wallaRes.status   === 'fulfilled' ? wallaRes.value   : (console.error('❌ scrapeWallapop failed:', wallaRes.reason), []);

    // Interleaving round‐robin
    let allItems = interleaveMany([
      subitoItems,
      ebayItems,
      lbcItems,
      wallapopItems
    ]);

    // Se richiesto, filtro per singolo marketplace
    if (marketplace !== 'all') {
      allItems = allItems.filter(item => item.source === marketplace);
    }

    // Applico paginazione: prendo i primi MAX_PER_PAGE elementi
    const items   = allItems.slice(0, MAX_PER_PAGE);
    const hasMore = allItems.length > MAX_PER_PAGE;

    // Imposto caching per CDN / Edge
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    console.log(`📦 Returning ${items.length} items (hasMore=${hasMore})`);

    return res.status(200).json({ items, hasMore });
  }
  catch (err) {
    console.error('❌ [api/search] unexpected error:', err);
    return res.status(500).json({ error: 'Search failed' });
  }
}
