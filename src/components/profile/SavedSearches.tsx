import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, Bell, BellOff, Edit, ArrowLeft, Loader2 } from 'lucide-react';
import { getUserSavedSearches, deleteSavedSearch, updateSavedSearch } from '../../services/userService';
import { SavedSearch } from '../../types';
import toast from 'react-hot-toast';

const SavedSearches = () => {
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSearch, setEditingSearch] = useState<SavedSearch | null>(null);
  
  useEffect(() => {
    loadSavedSearches();
  }, []);
  
  const loadSavedSearches = async () => {
    try {
      setLoading(true);
      const savedSearches = await getUserSavedSearches();
      setSearches(savedSearches);
    } catch (error) {
      console.error("Error loading saved searches:", error);
      toast.error("Errore nel caricamento delle ricerche salvate");
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteSearch = async (id: string) => {
    try {
      await deleteSavedSearch(id);
      setSearches(searches.filter(search => search.id !== id));
      toast.success("Ricerca eliminata con successo");
    } catch (error) {
      console.error("Error deleting search:", error);
      toast.error("Errore nell'eliminazione della ricerca");
    }
  };
  
  const handleToggleNotifications = async (search: SavedSearch) => {
    try {
      const updatedSearch = {
        ...search,
        notificationsEnabled: !search.notificationsEnabled
      };
      
      await updateSavedSearch(updatedSearch);
      
      setSearches(searches.map(s => s.id === search.id ? updatedSearch : s));
      
      toast.success(
        updatedSearch.notificationsEnabled 
          ? "Notifiche attivate con successo" 
          : "Notifiche disattivate con successo"
      );
    } catch (error) {
      console.error("Error updating search:", error);
      toast.error("Errore nell'aggiornamento della ricerca");
    }
  };
  
  const handleUpdateSearch = async (updatedSearch: SavedSearch) => {
    try {
      await updateSavedSearch(updatedSearch);
      setSearches(searches.map(s => s.id === updatedSearch.id ? updatedSearch : s));
      setEditingSearch(null);
      toast.success("Ricerca aggiornata con successo");
    } catch (error) {
      console.error("Error updating search:", error);
      toast.error("Errore nell'aggiornamento della ricerca");
    }
  };
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link to="/profile" className="flex items-center text-blue-600 hover:text-blue-800">
            <ArrowLeft className="h-4 w-4 mr-1" />
            <span>Torna al profilo</span>
          </Link>
        </div>
        
        <h1 className="text-2xl font-bold text-slate-800 mb-6">Le tue ricerche salvate</h1>
        
        {searches.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-xl font-medium text-slate-800 mb-2">Nessuna ricerca salvata</h3>
            <p className="text-slate-600 mb-6">Salva una ricerca per ricevere notifiche quando vengono pubblicati nuovi annunci.</p>
            <Link 
              to="/"
              className="inline-flex items-center py-2 px-6 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Inizia a cercare
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {editingSearch ? (
              <EditSearchForm 
                search={editingSearch} 
                onSave={handleUpdateSearch} 
                onCancel={() => setEditingSearch(null)} 
              />
            ) : (
              <div className="divide-y divide-slate-200">
                {searches.map((search) => (
                  <SearchItem 
                    key={search.id}
                    search={search}
                    onEdit={() => setEditingSearch(search)}
                    onDelete={() => handleDeleteSearch(search.id)}
                    onToggleNotifications={() => handleToggleNotifications(search)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

interface SearchItemProps {
  search: SavedSearch;
  onEdit: () => void;
  onDelete: () => void;
  onToggleNotifications: () => void;
}

const SearchItem = ({ search, onEdit, onDelete, onToggleNotifications }: SearchItemProps) => {
  const lastUpdated = new Date(search.updatedAt).toLocaleDateString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  
  return (
    <div className="p-4 hover:bg-slate-50">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between">
        <div className="mb-3 sm:mb-0">
          <Link 
            to={`/search?q=${encodeURIComponent(search.query)}`}
            className="text-lg font-medium text-blue-600 hover:text-blue-800"
          >
            {search.query}
          </Link>
          
          <div className="flex flex-wrap items-center mt-1 gap-2">
            <span className="text-sm text-slate-500">
              Aggiornata il {lastUpdated}
            </span>
            
            {search.filters.priceMin && search.filters.priceMax && (
              <span className="bg-slate-100 text-slate-700 text-xs px-2 py-1 rounded-full">
                {search.filters.priceMin}€ - {search.filters.priceMax}€
              </span>
            )}
            
            {search.filters.marketplace !== 'all' && (
              <span className="bg-slate-100 text-slate-700 text-xs px-2 py-1 rounded-full">
                {search.filters.marketplace}
              </span>
            )}
            
            <span className={`flex items-center text-xs px-2 py-1 rounded-full ${
              search.notificationsEnabled 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {search.notificationsEnabled ? (
                <>
                  <Bell className="h-3 w-3 mr-1" />
                  Notifiche attive
                </>
              ) : (
                <>
                  <BellOff className="h-3 w-3 mr-1" />
                  Notifiche disattivate
                </>
              )}
            </span>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={onToggleNotifications}
            className={`p-2 rounded-full ${
              search.notificationsEnabled 
                ? 'text-green-600 hover:bg-green-50' 
                : 'text-slate-400 hover:bg-slate-100'
            }`}
            title={search.notificationsEnabled ? "Disattiva notifiche" : "Attiva notifiche"}
          >
            {search.notificationsEnabled ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
          </button>
          
          <button
            onClick={onEdit}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
            title="Modifica ricerca"
          >
            <Edit className="h-5 w-5" />
          </button>
          
          <button
            onClick={onDelete}
            className="p-2 text-red-600 hover:bg-red-50 rounded-full"
            title="Elimina ricerca"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

interface EditSearchFormProps {
  search: SavedSearch;
  onSave: (search: SavedSearch) => void;
  onCancel: () => void;
}

const EditSearchForm = ({ search, onSave, onCancel }: EditSearchFormProps) => {
  const [query, setQuery] = useState(search.query);
  const [priceMin, setPriceMin] = useState(search.filters.priceMin || '');
  const [priceMax, setPriceMax] = useState(search.filters.priceMax || '');
  const [marketplace, setMarketplace] = useState(search.filters.marketplace || 'all');
  const [notificationsEnabled, setNotificationsEnabled] = useState(search.notificationsEnabled);
  const [frequency, setFrequency] = useState(search.notificationFrequency || 'instant');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    onSave({
      ...search,
      query,
      filters: {
        priceMin,
        priceMax,
        marketplace
      },
      notificationsEnabled,
      notificationFrequency: frequency,
      updatedAt: new Date().toISOString()
    });
  };
  
  return (
    <form onSubmit={handleSubmit} className="p-6">
      <h2 className="text-xl font-medium text-slate-800 mb-4">Modifica ricerca</h2>
      
      <div className="space-y-6">
        <div>
          <label htmlFor="query" className="block text-sm font-medium text-slate-700 mb-1">
            Ricerca
          </label>
          <input
            id="query"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="block w-full py-2 px-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="priceMin" className="block text-sm font-medium text-slate-700 mb-1">
              Prezzo minimo
            </label>
            <input
              id="priceMin"
              type="number"
              value={priceMin}
              onChange={(e) => setPriceMin(e.target.value)}
              placeholder="€"
              className="block w-full py-2 px-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label htmlFor="priceMax" className="block text-sm font-medium text-slate-700 mb-1">
              Prezzo massimo
            </label>
            <input
              id="priceMax"
              type="number"
              value={priceMax}
              onChange={(e) => setPriceMax(e.target.value)}
              placeholder="€"
              className="block w-full py-2 px-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        
        <div>
          <label htmlFor="marketplace" className="block text-sm font-medium text-slate-700 mb-1">
            Marketplace
          </label>
          <select
            id="marketplace"
            value={marketplace}
            onChange={(e) => setMarketplace(e.target.value)}
            className="block w-full py-2 px-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Tutti</option>
            <option value="subito">Subito.it</option>
            <option value="ebay">eBay</option>
            <option value="facebook">Facebook Marketplace</option>
            <option value="vinted">Vinted</option>
          </select>
        </div>
        
        <div>
          <div className="flex items-center mb-4">
            <input
              id="notifications"
              type="checkbox"
              checked={notificationsEnabled}
              onChange={(e) => setNotificationsEnabled(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
            />
            <label htmlFor="notifications" className="ml-2 block text-sm text-slate-700">
              Ricevi notifiche per nuovi annunci
            </label>
          </div>
          
          {notificationsEnabled && (
            <div>
              <label htmlFor="frequency" className="block text-sm font-medium text-slate-700 mb-1">
                Frequenza notifiche
              </label>
              <select
                id="frequency"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="block w-full py-2 px-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="instant">Immediata</option>
                <option value="daily">Giornaliera</option>
                <option value="weekly">Settimanale</option>
              </select>
            </div>
          )}
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="py-2 px-4 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
          >
            Annulla
          </button>
          
          <button
            type="submit"
            className="py-2 px-6 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Salva modifiche
          </button>
        </div>
      </div>
    </form>
  );
};

export default SavedSearches;