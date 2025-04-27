export interface Item { title: string; price: number; url: string; imageUrl: string; site: string; }

export async function searchAcrossMarketplaces(query: string, page: number, filters: Filters): Promise<SearchResults> {
  // TODO: integra qui paginazione e filtri
  const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error('Search API error');
  return res.json();
}
