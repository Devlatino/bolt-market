import { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onSearch: (value: string) => void;
  suggestions?: string[];
}

const SearchBar = ({ 
  placeholder, 
  value, 
  onChange, 
  onSearch,
  suggestions = [] 
}: SearchBarProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && value.trim()) {
      onSearch(value);
    }
  };

  const handleClear = () => {
    onChange('');
    inputRef.current?.focus();
  };

  useEffect(() => {
    setShowSuggestions(isFocused && suggestions.length > 0);
  }, [isFocused, suggestions]);

  return (
    <div className="relative w-full">
      <div className={`flex items-center w-full p-4 bg-white rounded-full shadow-md transition-all duration-200 ${isFocused ? 'ring-2 ring-blue-500 shadow-lg' : ''}`}>
        <Search className="h-5 w-5 text-slate-400 mr-2" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyPress={handleKeyPress}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          placeholder={placeholder}
          className="flex-grow bg-transparent outline-none text-slate-800 placeholder-slate-400"
        />
        {value && (
          <button 
            onClick={handleClear}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
      
      {showSuggestions && (
        <div className="absolute w-full mt-2 bg-white rounded-lg shadow-lg z-10 max-h-60 overflow-auto">
          {suggestions.map((suggestion, index) => (
            <div 
              key={index}
              onClick={() => {
                onChange(suggestion);
                onSearch(suggestion);
              }}
              className="px-4 py-3 hover:bg-slate-100 cursor-pointer"
            >
              {suggestion}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchBar;