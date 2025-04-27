import { Link } from 'react-router-dom';
import { Search, Mail, Github as GitHub } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-slate-800 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center mb-4">
              <Search className="h-6 w-6 text-blue-400 mr-2" />
              <span className="font-bold text-xl">UniCerca</span>
            </div>
            <p className="text-slate-300 mb-4">
              La piattaforma che trova qualsiasi cosa in vendita su Internet con notifiche intelligenti.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-slate-300 hover:text-white">
                <GitHub className="h-5 w-5" />
              </a>
              <a href="#" className="text-slate-300 hover:text-white">
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold text-lg mb-4">Link Rapidi</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-slate-300 hover:text-white">Home</Link>
              </li>
              <li>
                <Link to="/search" className="text-slate-300 hover:text-white">Cerca</Link>
              </li>
              <li>
                <Link to="/saved-searches" className="text-slate-300 hover:text-white">Ricerche salvate</Link>
              </li>
              <li>
                <Link to="/profile" className="text-slate-300 hover:text-white">Profilo</Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-lg mb-4">Informazioni</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/privacy" className="text-slate-300 hover:text-white">Privacy Policy</Link>
              </li>
              <li>
                <Link to="/terms" className="text-slate-300 hover:text-white">Termini di Servizio</Link>
              </li>
              <li>
                <Link to="/about" className="text-slate-300 hover:text-white">Chi siamo</Link>
              </li>
              <li>
                <Link to="/contact" className="text-slate-300 hover:text-white">Contatti</Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-slate-700 text-center text-slate-400">
          <p>© {new Date().getFullYear()} UniCerca. Tutti i diritti riservati.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;