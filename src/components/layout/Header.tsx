import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, User, Menu, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const isHomePage = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  const handleLogout = async () => {
    await logout();
    navigate('/');
    setMobileMenuOpen(false);
  };
  
  return (
    <header className={`sticky top-0 z-10 transition-all duration-200 ${
      isScrolled || !isHomePage 
        ? 'bg-white shadow-sm' 
        : 'bg-transparent'
    }`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center">
            <Search className="h-6 w-6 text-blue-600 mr-2" />
            <span className="font-bold text-xl text-slate-800">UniCerca</span>
          </Link>
          
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/search" className="text-slate-600 hover:text-slate-900">
              Cerca
            </Link>
            <Link to="/saved-searches" className="text-slate-600 hover:text-slate-900">
              Ricerche salvate
            </Link>
            {user ? (
              <div className="relative group">
                <button className="flex items-center text-slate-600 hover:text-slate-900">
                  <User className="h-5 w-5 mr-1" />
                  <span>{user.displayName || user.email}</span>
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-lg py-1 hidden group-hover:block">
                  <Link 
                    to="/profile" 
                    className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                  >
                    Profilo
                  </Link>
                  <Link 
                    to="/notification-preferences" 
                    className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                  >
                    Notifiche
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <Link 
                to="/login" 
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Accedi
              </Link>
            )}
          </nav>
          
          <button 
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6 text-slate-800" />
            ) : (
              <Menu className="h-6 w-6 text-slate-800" />
            )}
          </button>
        </div>
      </div>
      
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t">
          <div className="container mx-auto px-4 py-3">
            <nav className="flex flex-col space-y-3">
              <Link 
                to="/search" 
                className="py-2 text-slate-600"
                onClick={() => setMobileMenuOpen(false)}
              >
                Cerca
              </Link>
              <Link 
                to="/saved-searches" 
                className="py-2 text-slate-600"
                onClick={() => setMobileMenuOpen(false)}
              >
                Ricerche salvate
              </Link>
              {user ? (
                <>
                  <Link 
                    to="/profile" 
                    className="py-2 text-slate-600"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Profilo
                  </Link>
                  <Link 
                    to="/notification-preferences" 
                    className="py-2 text-slate-600"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Notifiche
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="py-2 text-left text-slate-600"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link 
                  to="/login" 
                  className="py-2 text-slate-600"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Accedi
                </Link>
              )}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;