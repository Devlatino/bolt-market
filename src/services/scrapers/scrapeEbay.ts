// File: src/services/scrapers/scrapeEbay.ts
import axios from 'axios';
import cheerio from 'cheerio';
import type { ListingItem } from '../../types';

export async function scrapeEbay(query: string): Promise<ListingItem[]> {
  const url = `https://www.ebay.it/sch/i.html?_nkw=${encodeURIComponent(query)}`;
  const { data: html } = await axios.get(url);
  const $ = cheerio.load(html);

  const items: ListingItem[] = [];
  $('.s-item').each((_, el) => {
    const $el = $(el);
    const title = $el.find('.s-item__title').text().trim();
    const link = $el.find('.s-item__link').attr('href') || '';

    // Gestione srcset e placeholder
    const $img = $el.find('.s-item__image-img');
    let imgUrl = $img.attr('src') || $img.attr('data-src') || '';
    if ((!imgUrl || imgUrl.includes('tr/spacer')) && $img.attr('srcset')) {
      const srcset = $img.attr('srcset')!;
      imgUrl = srcset.split(',')[0].trim().split(' ')[0];
    }

    // Estrai e normalizza il prezzo
    const priceText = $el.find('.s-item__price').first().text().trim();
    const cleaned = priceText.replace(/[^\d.,]/g, '');
    const normalized = cleaned.replace(/\./g, '').replace(',', '.');
    const price = parseFloat(normalized) || 0;

    if (title && link) {
      items.push({
        id: link,
        title,
        description: title,
        price,
        imageUrl: imgUrl,
        url: link,
        source: 'ebay',
        location: '',
        date: Date.now(),
      });
    }
  });

  return items;
}