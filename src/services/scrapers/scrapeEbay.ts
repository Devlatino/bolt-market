// src/services/scrapers/scrapeEbay.js

const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeEbay(query, { priceMin, priceMax, marketplace }) {
  const url = `https://www.ebay.it/sch/i.html?_nkw=${encodeURIComponent(query)}`;
  const { data: html } = await axios.get(url);
  const $ = cheerio.load(html);

  const items = [];
  $('.s-item').each((_, el) => {
    const title = $(el).find('.s-item__title').text().trim();
    const link  = $(el).find('.s-item__link').attr('href');
    const img   = $(el).find('.s-item__image-img').attr('src') ||
                  $(el).find('.s-item__image-img').attr('data-src');
    const price = $(el).find('.s-item__price').first().text().trim();

    if (title && link) {
      items.push({ source: 'ebay', title, link, img, price });
    }
  });

  return items;
}

module.exports = { scrapeEbay };
