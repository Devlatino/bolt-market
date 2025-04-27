// api/search.js

const scrapeEbay   = require('../src/services/scrapers/scrapeEbay');
const scrapeSubito = require('../src/services/scrapers/scrapeSubito');

/**
 * Alterna gli elementi di due array in uscita:
 * [e0, e1, e2], [s0, s1, s2, s3] → [e0, s0, e1, s1, e2, s2, s3]
 */
function interleave(arr1, arr2) {
  const out = [];
  const max = Math.max(arr1.length, arr2.length);
  for (let i = 0; i < max; i++) {
    if (arr1[i]) out.push(arr1[i]);
    if (arr2[i]) out.push(arr2[i]);
  }
  return out;
}

module.exports = async function handler(req, res) {
  const q          = req.query.q || '';
  const page       = parseInt(req.query.page, 10) || 1;
  const perPage    = 20;
  // opzionali, se vorrai usarli nei tuoi scraper
  const priceMin   = req.query.priceMin || '';
  const priceMax   = req.query.priceMax || '';
  const marketplace= req.query.marketplace || 'all';

  try {
    // Esegui in parallelo i due scraper
    const [ebayItems, subitoItems] = await Promise.all([
      scrapeEbay(q, { priceMin, priceMax, marketplace }),
      scrapeSubito(q, { priceMin, priceMax, marketplace }),
    ]);

    // Mescola i risultati
    const allItems = interleave(ebayItems, subitoItems);

    // Paginazione
    const start   = (page - 1) * perPage;
    const paged   = allItems.slice(start, start + perPage);
    const hasMore = allItems.length > start + perPage;

    return res.status(200).json({ items: paged, hasMore });
  } catch (err) {
    console.error('Search API error:', err);
    return res.status(500).json({ error: 'Errore interno del server' });
  }
};
