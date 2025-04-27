import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import SearchBar from '../common/SearchBar';

const HomePage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);

  const handleSearch = (query: string) => {
    setIsAnimating(true);
    setTimeout(() => {
      navigate(`/search?q=${encodeURIComponent(query)}`);
    }, 300);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      <div className={`transition-all duration-300 ease-in-out transform ${isAnimating ? 'scale-95 opacity-80' : 'scale-100 opacity-100'}`}>
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-2 text-slate-800">
          Cercatore Universale
        </h1>
        <p className="text-lg md:text-xl text-center mb-8 text-slate-600">
          Trova qualsiasi cosa in tutti i marketplace. Una sola ricerca.
        </p>
        
        <div className="w-full max-w-2xl mx-auto mb-6">
          <SearchBar 
            placeholder="Cosa stai cercando?" 
            value={searchQuery}
            onChange={setSearchQuery}
            onSearch={handleSearch}
          />
        </div>
        
        <div className="flex justify-center">
          <button
            onClick={() => handleSearch(searchQuery)}
            className="flex items-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg shadow-md transition-all duration-200 transform hover:scale-105"
          >
            <Search className="mr-2 h-5 w-5" />
            Cerca subito
          </button>
        </div>
        
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <FeatureCard 
            title="Ricerca intelligente" 
            description="Cerca in tutti i principali marketplace contemporaneamente." 
            icon="🔍"
          />
          <FeatureCard 
            title="Notifiche automatiche" 
            description="Ricevi aggiornamenti quando appaiono nuovi annunci." 
            icon="🔔"
          />
          <FeatureCard 
            title="Risparmia tempo" 
            description="Non dover più controllare manualmente tutti i siti." 
            icon="⏱️"
          />
        </div>
      </div>
    </div>
  );
};

const FeatureCard = ({ title, description, icon }: { title: string, description: string, icon: string }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200">
    <div className="text-3xl mb-3">{icon}</div>
    <h3 className="font-semibold text-lg mb-2 text-slate-800">{title}</h3>
    <p className="text-slate-600">{description}</p>
  </div>
);

export default HomePage;