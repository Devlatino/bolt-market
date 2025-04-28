import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Filter, BookmarkPlus, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { searchAcrossMarketplaces } from '../../services/searchService';
import { saveSearch } from '../../services/userService';
import SearchBar from '../common/SearchBar';
import { ListingItem } from '../../types';
import toast from 'react-hot-toast';

const PLACEHOLDER_IMG = '/placeholder.png';

const SearchResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<ListingItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreResults, setHasMoreResults] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    priceMin: '',
    priceMax: '',
    marketplace: 'all' as string
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const query = params.get('q') || '';
    setSearchQuery(query);
    if (query) {
      performSearch(query, 1);
    }
  }, [location.search]);

  const performSearch = async (query: string, page = 1) => {
    if (!query.trim()) return;
    try {
      if (page === 1) {
        setIsLoading(true);
        setResults([]);
      } else {
        setIsLoadingMore(true);
      }
      const { items, hasMore } = await searchAcrossMarketplaces(query, page, {
        priceMin: filters.priceMin ? Number(filters.priceMin) : undefined,
        priceMax: filters.priceMax ? Number(filters.priceMax) : undefined,
        marketplace: filters.marketplace
      });
      setResults(prev => page === 1 ? items : [...prev, ...items]);
      setHasMoreResults(hasMore);
      setCurrentPage(page);
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Si è verificato un errore durante la ricerca. Riprova.");
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const handleSearch = (query: string) => {
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  const handleSaveSearch = async () => {
    if (!user) {
      toast.error("Accedi per salvare la ricerca");
      navigate('/login', { state: { from: location.pathname + location.search } });
      return;
    }
    try {
      await saveSearch(searchQuery, filters);
      toast.success("Ricerca salvata con successo!");
    } catch (error) {
      console.error("Error saving search:", error);
      toast.error("Errore nel salvare la ricerca");
    }
  };

  const handleLoadMore = () => performSearch(searchQuery, currentPage + 1);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const applyFilters = () => {
    setCurrentPage(1);
    performSearch(searchQuery, 1);
    setShowFilters(false);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-8">
        <div className="flex items-center flex-wrap gap-4">
          <div className="flex-grow">
            <SearchBar
              placeholder="Cosa stai cercando?"
              value={searchQuery}
              onChange={setSearchQuery}
              onSearch={handleSearch}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center py-2 px-4 bg-white text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtri
            </button>
            <button
              onClick={handleSaveSearch}
              className="flex items-center py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <BookmarkPlus className="h-4 w-4 mr-2" />
              Salva ricerca
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="mt-4 p-4 bg-white rounded-lg shadow-md animate-slideDown">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Prezzo minimo
                </label>
                <input
                  type="number"
                  name="priceMin"
                  value={filters.priceMin}
                  onChange={handleFilterChange}
                  placeholder="€"
                  className="w-full p-2 border border-slate-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Prezzo massimo
                </label>
                <input
                  type="number"
                  name="priceMax"
                  value={filters.priceMax}
                  onChange={handleFilterChange}
                  placeholder="€"
                  className="w-full p-2 border border-slate-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Marketplace
                </label>
                <select
                  name="marketplace"
                  value={filters.marketplace}
                  onChange={handleFilterChange}
                  className="w-full p-2 border border-slate-300 rounded-md"
                >
                  <option value="all">Tutti</option>
                  <option value="subito">Subito.it</option>
                  <option value="ebay">eBay</option>
                  <option value="leboncoin">Leboncoin</option>
                  <option value="wallapop">Wallapop</option>
                </select>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={applyFilters}
                className="py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Applica filtri
              </button>
            </div>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
          <span className="ml-2 text-lg text-slate-600">Ricerca in corso...</span>
        </div>
      ) : results.length > 0 ? (
        <>
          <div className="mb-4 text-slate-600">
            Trovati {results.length} risultati per "{searchQuery}"
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((item, idx) => (
              <ListingCard key={idx} item={item} />
            ))}
          </div>
          {hasMoreResults && (
            <div className="flex justify-center mt-8">
              <button
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="py-2 px-6 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg flex items-center disabled:opacity-50"
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Caricamento...
                  </>
                ) : (
                  'Carica altri risultati'
                )}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">🔍</div>
          <h3 className="text-xl font-medium text-slate-800 mb-2">Nessun risultato trovato</h3>
          <p className="text-slate-600">Prova a modificare la tua ricerca o i filtri</p>
        </div>
      )}
    </div>
  );
};

const ListingCard = ({ item }: { item: ListingItem }) => (
  <a
    href={item.url}
    target="_blank"
    rel="noopener noreferrer"
    className="block bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200"
  >
    <div className="relative pb-[60%] bg-slate-100 overflow-hidden">
      <img
        src={item.imageUrl || PLACEHOLDER_IMG}
        alt={item.title}
        className="absolute w-full h-full object-cover transition-transform duration-300 hover:scale-105"
      />
      <div className="absolute top-2 right-2 bg-slate-800 bg-opacity-75 text-white px-2 py-1 text-xs rounded">
        {item.source}
      </div>
    </div>
    <div className="p-4">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-medium text-slate-800 line-clamp-2">{item.title}</h3>
        <span className="font-semibold text-blue-600 whitespace-nowrap ml-2">€{item.price}</span>
      </div>
      <p className="text-sm text-slate-600 line-clamp-2 mb-2">{item.description}</p>
      <div className="flex justify-between items-center text-xs text-slate-500">
        <span>{item.location}</span>
        <span>{formatDate(item.date)}</span>
      </div>
    </div>
  </a>
);

const formatDate = (dateInput: string | number) => {
  const date = new Date(dateInput);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Oggi';
  if (diffDays === 1) return 'Ieri';
  if (diffDays < 7) return `${diffDays} giorni fa`;
  return date.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' });
};

export default SearchResults;
