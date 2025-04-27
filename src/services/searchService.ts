import type { ListingItem } from '../types';

export interface Filters {
  priceMin?: number;
  priceMax?: number;
  marketplace?: string;
}

export interface SearchResults {
  items: ListingItem[];
  hasMore: boolean;
}

export async function searchAcrossMarketplaces(
  query: string,
  page = 1,
  filters: Filters = {}
): Promise<SearchResults> {
  const params = new URLSearchParams({
    q:        query,
    page:     page.toString(),
    priceMin: filters.priceMin?.toString()  || '',
    priceMax: filters.priceMax?.toString()  || '',
    marketplace: filters.marketplace || ''
  });
  const res = await fetch(`/api/search?${params.toString()}`);
  console.log("🔍 fetch URL:", `\/api\/search?${params.toString()}`);
  const data = await res.json();
  console.log("📦 search response:", data);
  return data as SearchResults;
  if (!res.ok) throw new Error('Search API error');
  return res.json() as Promise<SearchResults>;
}

// il front-end importa `search`, quindi allineiamo l’export
export const search = searchAcrossMarketplaces;

export const search = searchAcrossMarketplaces;
