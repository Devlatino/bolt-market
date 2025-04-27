import type { ListingItem } from '../../types';
import axios from 'axios';
import cheerio from 'cheerio';

export async function scrapeEbay(query: string): Promise<ListingItem[]> {
  const url = \`https://www.ebay.it/sch/i.html?_nkw=\${encodeURIComponent(query)}\`;
  const resp = await axios.get(url);
  const $ = cheerio.load(resp.data);
  const items: ListingItem[] = [];
  $('.s-item').each((_, el) => {
    const title = $(el).find('.s-item__title').text().trim();
    const priceText = $(el).find('.s-item__price').text().trim();
    const price = parseFloat(priceText.replace(/[^\d.,]/g, '').replace(',', '.'));
    const link = $(el).find('.s-item__link').attr('href') || '';
    if (title && link) items.push({ title, price, url: link });
  });
  return items;
}
