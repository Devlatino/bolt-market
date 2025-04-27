export interface Item { title: string; price: number; url: string; imageUrl: string; site: string; }

export async function search(query: string): Promise<Item[]> {
  const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error('Search API error');
  return res.json();
}
