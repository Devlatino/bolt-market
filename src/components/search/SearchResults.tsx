// src/components/search/SearchResults.tsx
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Filter, BookmarkPlus, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { searchAcrossMarketplaces } from '../../services/searchService';
import { saveSearch } from '../../services/userService';
import SearchBar from '../common/SearchBar';
import { ListingItem } from '../../types';
import toast from 'react-hot-toast';

const PLACEHOLDER_IMG = '/placeholder.png'; // assicurati di avere un asset in public/

const SearchResults = () => {
  // ... (stesso setup di prima)

  return (
    <div className="container mx-auto px-4 py-6">
      {/* … barre di ricerca e filtri … */}

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
            {results.map((item, index) => (
              <ListingCard key={index} item={item} />
            ))}
          </div>

          {/* … carica altri … */}
        </>
      ) : (
        // … nessun risultato …
      )}
    </div>
  );
};

const ListingCard = ({ item }: { item: ListingItem }) => {
  return (
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
          <span className="font-semibold text-blue-600 whitespace-nowrap ml-2">
            €{item.price}
          </span>
        </div>
        <p className="text-sm text-slate-600 line-clamp-2 mb-2">
          {item.description}
        </p>
        <div className="flex justify-between items-center text-xs text-slate-500">
          <span>{item.location}</span>
          <span>{formatDate(item.date)}</span>
        </div>
      </div>
    </a>
  );
};

// … formatDate come prima …

export default SearchResults;
