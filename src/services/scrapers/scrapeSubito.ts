// src/services/scrapers/scrapeSubito.js

const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeSubito(query, { priceMin, priceMax, marketplace }) {
  // Nota: la path corretta per risultati generici è senza "tutto"
  const url = `https://www.subito.it/annunci-italia/vendita/?q=${encodeURIComponent(query)}`;
  const { data: html } = await axios.get(url);
  const $ = cheerio.load(html);

  const items = [];
  $('article.Item_card__').each((_, el) => {
    const title = $(el).find('h2.Item_title__').text().trim();
    const link  = 'https://www.subito.it' + $(el).find('a').attr('href');
    const img   = $(el).find('img.Item_image__').attr('src') ||
                  $(el).find('img.Item_image__').attr('data-src');
    const price = $(el).find('span.Item_price__').text().trim();

    if (title && link) {
      items.push({ source: 'subito', title, link, img, price });
    }
  });

  return items;
}

module.exports = { scrapeSubito };
