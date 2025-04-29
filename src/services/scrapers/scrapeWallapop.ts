import axios from 'axios';
export async function scrapeWallapop(query: string, page = 1): Promise<ListingItem[]> {
  const limit = 20;
  const offset = (page - 1) * limit;
  const url = 'https://api.wallapop.com/api/v3/general/search';

  const resp = await axios.get(url, {
    params: { keywords: query, offset, limit, order_by: 'creation_time' },
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      'Accept-Language': 'it-IT,it;q=0.9',
      Referer: `https://es.wallapop.com/search?keywords=${encodeURIComponent(query)}`
    },
    timeout: 20000
  });

  const items: any[] = resp.data.search_objects || [];
  return items.map(ad => {
    const uri     = ad.uri    || ad.link || '';
    const fullUrl = uri.startsWith('http')
      ? uri
      : `https://www.wallapop.com${uri}`;

    // Ecco la riga “fixata” con le parentesi
    const priceValue = (ad.price?.amount ?? parseFloat(String(ad.price))) || 0;

    return {
      id:           ad.id ?? fullUrl,
      title:        ad.title        || '',
      description:  ad.description  || '',
      price:        priceValue,
      imageUrl:     ad.images?.[0]?.url || '',
      url:          fullUrl,
      source:       'wallapop',
      location:     ad.location?.city || '',
      date:         ad.creationTime
                     ? Date.parse(ad.creationTime)
                     : Date.now()
    } as ListingItem;
  });
}
