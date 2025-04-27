import type { ListingItem } from '../../types';
import axios from 'axios';
import { load } from 'cheerio';

const ITEMS_PER_PAGE = 20;

export async function scrapeSubito(
  query: string,
  page: number = 1
): Promise<ListingItem[]> {
  console.log(`🚀 [scrapeSubito] start for query="${query}", page=${page}`);

  const offset = (page - 1) * ITEMS_PER_PAGE;
  const baseUrl = `https://www.subito.it/annunci-italia/vendita`;
  const url =
    offset > 0
      ? `${baseUrl}/?q=${encodeURIComponent(query)}&o=${offset}`
      : `${baseUrl}/?q=${encodeURIComponent(query)}`;

  console.log(`📡 [scrapeSubito] fetching URL: ${url}`);
  const resp = await axios.get(url, { timeout: 60000 });
  const $ = load(resp.data);
  const items: ListingItem[] = [];

  // Parsing Next.js embedded data for listings
  const nextData = $('#__NEXT_DATA__').html();
  if (nextData) {
    try {
      const json = JSON.parse(nextData);
      const results = json.props.pageProps.listings?.results || [];
      for (const card of results) {
        items.push({
          id: card.id,
          title: card.title,
          description: card.attributes?.description || '',
          price: card.price?.value || 0,
          imageUrl: card.images?.[0]?.url || '',
          url: `https://www.subito.it${card.url}`,
          source: 'subito',
          location: card.region || '',
          date: new Date(card.createdAt).getTime(),
        });
      }
    } catch (e) {
      console.error('❌ [scrapeSubito] errore parsing JSON:', e);
    }
  }

  console.log(`✅ [scrapeSubito] found ${items.length} items`);
  return items;
}