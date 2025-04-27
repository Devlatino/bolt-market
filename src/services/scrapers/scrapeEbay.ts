// src/services/scrapers/scrapeEbay.ts
import type { ListingItem } from '../../types';
import axios from 'axios';
import { load } from 'cheerio';

export async function scrapeEbay(query: string): Promise<ListingItem[]> {
  console.log(`🚀 [scrapeEbay] start for query="${query}"`);

  // Costruzione URL corretta con template literal
  const url = `https://www.ebay.it/sch/i.html?_nkw=${encodeURIComponent(query)}`;
  console.log(`📡 [scrapeEbay] fetching URL: ${url}`);

  const resp = await axios.get(url);
  const $ = load(resp.data);
  const items: ListingItem[] = [];

  $('.s-item').each((_, el) => {
    const title = $(el).find('.s-item__title').text().trim();
    if (!title || title.toLowerCase().includes('annuncio sponsorizzato')) return;

    const priceText = $(el).find('.s-item__price').first().text().trim();
    const price = parseFloat(
      priceText.replace(/[^\d.,]/g, '').replace(',', '.')
    ) || 0;

    const link = $(el).find('.s-item__link').attr('href') || '';
    const imageUrl = $(el).find('.s-item__image-img').attr('src') || '';
    const location = $(el)
      .find('.s-item__location')
      .text()
      .replace(/^Da\s+/i, '')
      .trim() || '';

    items.push({
      id: link,
      title,
      description: '',
      price,
      imageUrl,
      url: link,
      source: 'ebay',
      location,
      date: Date.now(),
    });
  });

  console.log(`✅ [scrapeEbay] found ${items.length} items`);
  return items;
}
