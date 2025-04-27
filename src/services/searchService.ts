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

  console.log("🔍 fetch URL:", `/api/search?${params.toString()}`);
  const res = await fetch(`/api/search?${params.toString()}`);
  if (!res.ok) {
    const errText = await res.text();
    console.error("❌ API Error:", res.status, errText);
    throw new Error(`Search API failed with status ${res.status}`);
  }

  const data = await res.json() as SearchResults;
  console.log("📦 search response:", data);
  return data;
}

// Il front‐end importa `search`, quindi allineiamo l’export
export const search = searchAcrossMarketplaces;
