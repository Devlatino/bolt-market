import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, LogIn, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get return path from location state, default to '/'
  const from = location.state?.from || '/';
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Per favore, compila tutti i campi');
      return;
    }
    
    try {
      setLoading(true);
      await login(email, password);
      toast.success('Accesso effettuato con successo!');
      navigate(from);
    } catch (error) {
      console.error("Login error:", error);
      toast.error('Errore di accesso. Verifica email e password.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="flex items-center justify-center min-h-[70vh] px-4 py-12">
      <div className="bg-white shadow-md rounded-lg max-w-md w-full p-6 md:p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-slate-800">Accedi al tuo account</h2>
          <p className="text-slate-600 mt-2">
            Bentornato! Accedi per gestire le tue ricerche
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
              Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-slate-400" />
              </div>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="email@esempio.com"
                required
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-slate-400" />
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="••••••••"
                required
              />
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-700">
                Ricordami
              </label>
            </div>
            <a href="#" className="text-sm font-medium text-blue-600 hover:text-blue-500">
              Password dimenticata?
            </a>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin h-5 w-5 mr-2" />
                Accesso in corso...
              </>
            ) : (
              <>
                <LogIn className="h-5 w-5 mr-2" />
                Accedi
              </>
            )}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-slate-600">
            Non hai un account?{' '}
            <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
              Registrati
            </Link>
          </p>
        </div>
        
        <div className="mt-8">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-slate-500">Oppure continua con</span>
            </div>
          </div>
          
          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              type="button"
              className="flex justify-center items-center py-2 px-4 border border-slate-300 rounded-lg shadow-sm bg-white text-slate-700 hover:bg-slate-50"
            >
              <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.5 12.5C22.5 10.92 22.32 9.55 21.96 8.36H12V14.14H18.05C17.77 15.6 16.92 16.8 15.59 17.59V20.25H19.12C21.17 18.4 22.5 15.74 22.5 12.5Z" fill="#4285F4" />
                <path d="M12 23C14.97 23 17.46 22.07 19.12 20.25L15.59 17.59C14.6 18.25 13.37 18.65 12 18.65C9.01 18.65 6.5 16.64 5.62 13.92H1.95V16.65C3.6 20.4 7.5 23 12 23Z" fill="#34A853" />
                <path d="M5.62 13.92C5.43 13.33 5.33 12.71 5.33 12.07C5.33 11.43 5.44 10.81 5.62 10.22V7.49H1.95C1.33 8.9 1 10.44 1 12.07C1 13.7 1.33 15.24 1.95 16.65L5.62 13.92Z" fill="#FBBC05" />
                <path d="M12 5.5C13.57 5.5 14.97 6.09 16.06 7.11L19.16 4C17.45 2.4 15 1.37 12 1.37C7.5 1.37 3.6 3.97 1.95 7.72L5.62 10.45C6.5 7.73 9.01 5.72 12 5.72V5.5Z" fill="#EA4335" />
              </svg>
              Google
            </button>
            
            <button
              type="button"
              className="flex justify-center items-center py-2 px-4 border border-slate-300 rounded-lg shadow-sm bg-white text-slate-700 hover:bg-slate-50"
            >
              <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16.63 13.75C16.64 15.47 17.64 16.67 19.27 17.33C18.67 18.51 17.63 19.62 16.56 19.68C15.52 19.74 15.21 19.13 14.05 19.13C12.89 19.13 12.55 19.68 11.57 19.75C10.49 19.81 9.29 18.54 8.68 17.38C7.41 14.96 8.47 10.91 10.59 9.76C11.63 9.18 12.54 9.71 13.69 9.71C14.84 9.71 15.67 9.18 16.89 9.3C17.88 9.35 19.1 9.85 19.81 10.81C17.89 11.89 18.03 14.94 19.79 15.54M13.23 7.83C13.95 7.0 14.35 5.82 14.2 4.61C13.16 4.7 11.93 5.33 11.18 6.14C10.48 6.89 10.03 8.08 10.2 9.24C11.33 9.3 12.5 8.65 13.23 7.83Z" fill="currentColor" />
              </svg>
              Apple
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;