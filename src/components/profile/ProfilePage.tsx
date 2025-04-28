import { useState } from 'react';
import { Link } from 'react-router-dom';
import { User, Bell, Bookmark, Settings, LogOut, Save, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const ProfilePage = () => {
  const { user, updateProfile, logout } = useAuth();
  const [name, setName] = useState(user?.displayName || '');
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      await updateProfile({ displayName: name });
      toast.success('Profilo aggiornato con successo!');
      setEditing(false);
    } catch (error) {
      console.error("Update profile error:", error);
      toast.error('Errore nell\'aggiornamento del profilo');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">Il tuo profilo</h1>
        
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 h-32"></div>
          
          <div className="px-6 py-4 flex flex-col md:flex-row md:items-end -mt-16 mb-4">
            <div className="w-24 h-24 rounded-full bg-white p-1 shadow-md mb-4 md:mb-0">
              <div className="w-full h-full rounded-full bg-slate-200 flex items-center justify-center">
                <User className="h-12 w-12 text-slate-600" />
              </div>
            </div>
            
            <div className="md:ml-6 flex-grow">
              <h2 className="text-xl font-semibold text-slate-800">{user?.displayName || 'Utente'}</h2>
              <p className="text-slate-600">{user?.email}</p>
            </div>
            
            <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
              <button
                onClick={() => setEditing(!editing)}
                className="flex items-center py-2 px-4 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
              >
                <Settings className="h-4 w-4 mr-2" />
                {editing ? 'Annulla' : 'Modifica'}
              </button>
              
              <button
                onClick={() => logout()}
                className="flex items-center py-2 px-4 bg-red-50 border border-red-200 rounded-lg text-red-600 hover:bg-red-100"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
          
          {editing ? (
            <form onSubmit={handleSubmit} className="p-6 border-t border-slate-100">
              <div className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
                    Nome
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full py-2 px-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    disabled
                    className="block w-full py-2 px-3 border border-slate-300 bg-slate-50 rounded-lg cursor-not-allowed"
                  />
                  <p className="mt-1 text-xs text-slate-500">L'email non può essere modificata</p>
                </div>
                
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center py-2 px-6 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-70"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin h-4 w-4 mr-2" />
                        Salvataggio...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Salva modifiche
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div className="p-6 border-t border-slate-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ProfileCard 
                  to="/saved-searches"
                  title="Ricerche salvate"
                  description="Gestisci le tue ricerche e configura le notifiche"
                  count="5"
                  icon={<Bookmark className="h-5 w-5 text-blue-600" />}
                />
                
                <ProfileCard 
                  to="/notification-preferences"
                  title="Preferenze notifiche"
                  description="Gestisci come e quando ricevere gli aggiornamenti"
                  icon={<Bell className="h-5 w-5 text-blue-600" />}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface ProfileCardProps {
  to: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  count?: string;
}

const ProfileCard = ({ to, title, description, icon, count }: ProfileCardProps) => (
  <Link 
    to={to}
    className="block p-4 border border-slate-200 rounded-lg hover:border-blue-200 hover:bg-blue-50 transition-colors"
  >
    <div className="flex items-start">
      <div className="flex-shrink-0 bg-blue-100 p-2 rounded-lg">
        {icon}
      </div>
      
      <div className="ml-4 flex-grow">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-slate-800">{title}</h3>
          {count && (
            <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded-full text-xs font-medium">
              {count}
            </span>
          )}
        </div>
        <p className="text-sm text-slate-600 mt-1">{description}</p>
      </div>
    </div>
  </Link>
);

export default ProfilePage;