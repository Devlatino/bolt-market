// src/services/scrapers/scrapeSubito.js
const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeSubito(query) {
  // Costruisco l'URL corretto (notare il solo query string, senza "tutto")
  const url = `https://www.subito.it/annunci-italia/vendita/?q=${encodeURIComponent(query)}`;

  // Prendo l'HTML della pagina con un User-Agent generico
  const { data: html } = await axios.get(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64)' }
  });

  // Carico il DOM e cerco lo script con il JSON di Next.js
  const $ = cheerio.load(html);
  const nextDataScript = $('#__NEXT_DATA__').html();
  if (!nextDataScript) {
    // Se non lo trovo, significa che la pagina non ha risultati o il markup è cambiato
    return [];
  }

  // Estraggo e parsifico il JSON
  const nextData = JSON.parse(nextDataScript);

  // Scorro gli items che Subito espone in pageProps.searchResults.items
  const items = nextData
    .props
    .pageProps
    .searchResults
    ?.items || [];

  // Mappo in formato uniforme
  return items.map(item => ({
    title:       item.name,
    price:       item.price?.value || null,
    url:         `https://www.subito.it${item.url}`,
    image:       item.images?.[0]?.url || null,
    marketplace: 'subito',
  }));
}

module.exports = scrapeSubito;
