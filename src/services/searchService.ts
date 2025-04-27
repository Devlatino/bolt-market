import { ListingItem } from '../types';

// Mock data for search results
const mockListings: ListingItem[] = [
  {
    id: '1',
    title: 'iPhone 13 Pro Max 256GB in perfette condizioni',
    description: 'Vendo iPhone 13 Pro Max 256GB, colore Graphite, in perfette condizioni. Batteria al 92%, completo di scatola e accessori originali.',
    price: 799,
    imageUrl: 'https://images.pexels.com/photos/5750001/pexels-photo-5750001.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    url: 'https://example.com/listing/1',
    source: 'Subito.it',
    location: 'Milano',
    date: '2025-05-10T12:30:00.000Z'
  },
  {
    id: '2',
    title: 'MacBook Air M2 2022 16GB RAM',
    description: 'Vendo MacBook Air M2 (2022) con 16GB di RAM e 512GB SSD. Pochissimi cicli di ricarica, praticamente nuovo. Completo di confezione originale.',
    price: 1100,
    imageUrl: 'https://images.pexels.com/photos/18105/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    url: 'https://example.com/listing/2',
    source: 'eBay',
    location: 'Roma',
    date: '2025-05-09T15:45:00.000Z'
  },
  {
    id: '3',
    title: 'Sony PlayStation 5 Digital Edition',
    description: 'PS5 Digital Edition come nuova, usata pochissimo. Completa di controller DualSense e cavi originali.',
    price: 399,
    imageUrl: 'https://images.pexels.com/photos/11765870/pexels-photo-11765870.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    url: 'https://example.com/listing/3',
    source: 'Facebook Marketplace',
    location: 'Torino',
    date: '2025-05-11T09:20:00.000Z'
  }
];

// Generate more items based on the query for pagination demo
const generateMoreItems = (query: string, page: number): ListingItem[] => {
  return Array.from({ length: 6 }, (_, i) => {
    const id = `${page}-${i + 1}`;
    const date = new Date();
    date.setDate(date.getDate() - (i + 1));
    
    return {
      id,
      title: `${query} - Risultato ${page}.${i + 1}`,
      description: `Descrizione dell'articolo ${query} trovato nella pagina ${page}, risultato ${i + 1}.`,
      price: Math.floor(Math.random() * 1000) + 100,
      imageUrl: `https://images.pexels.com/photos/${Math.floor(Math.random() * 1000000) + 1}/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1`,
      url: `https://example.com/listing/${id}`,
      source: ['Subito.it', 'eBay', 'Facebook Marketplace', 'Vinted'][Math.floor(Math.random() * 4)],
      location: ['Milano', 'Roma', 'Torino', 'Napoli', 'Firenze'][Math.floor(Math.random() * 5)],
      date: date.toISOString()
    };
  });
};

interface SearchFilters {
  priceMin: string;
  priceMax: string;
  marketplace: string;
}

interface SearchResult {
  items: ListingItem[];
  hasMore: boolean;
  total: number;
}

export const searchAcrossMarketplaces = async (
  query: string, 
  page: number = 1, 
  filters: SearchFilters = { priceMin: '', priceMax: '', marketplace: 'all' }
): Promise<SearchResult> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      let results = page === 1 ? [...mockListings] : [];
      
      const moreItems = generateMoreItems(query, page);
      results = [...results, ...moreItems];
      
      if (filters.priceMin && Number.isFinite(Number(filters.priceMin))) {
        const minPrice = Number(filters.priceMin);
        results = results.filter(item => item.price >= minPrice);
      }
      
      if (filters.priceMax && Number.isFinite(Number(filters.priceMax))) {
        const maxPrice = Number(filters.priceMax);
        results = results.filter(item => item.price <= maxPrice);
      }
      
      if (filters.marketplace !== 'all') {
        results = results.filter(item => 
          item.source.toLowerCase().includes(filters.marketplace.toLowerCase())
        );
      }
      
      resolve({
        items: results,
        hasMore: page < 3,
        total: results.length + (page < 3 ? 6 : 0)
      });
    }, 1000);
  });
};