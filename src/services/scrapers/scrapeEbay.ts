import axios from 'axios';
import { load } from 'cheerio';
import type { Item } from './scrapeSubito';

export async function scrapeEbay(query: string): Promise<Item[]> {
  const res = await axios.get(`https://www.ebay.it/sch/i.html?_nkw=${encodeURIComponent(query)}`);
  const $ = load(res.data);
  const items: Item[] = [];
  $('li.s-item').each((_, el) => {
    const title = $(el).find('h3.s-item__title').text().trim();
    const priceText = $(el).find('.s-item__price').first().text().replace(/[^0-9,.]/g, '').replace(',', '.');
    const price = parseFloat(priceText) || 0;
    const url = $(el).find('a.s-item__link').attr('href') ?? '';
    const imageUrl = $(el).find('img.s-item__image-img').attr('src') ?? '';
    if (title) items.push({ title, price, url, imageUrl, site: 'eBay' });
  });
  return items;
}
