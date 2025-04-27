import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, Bell, Smartphone, Loader2, Save } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getUserNotificationPreferences, updateNotificationPreferences } from '../../services/userService';
import { NotificationPreferences as NotificationPrefsType } from '../../types';
import toast from 'react-hot-toast';

const NotificationPreferences = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPrefsType>({
    email: true,
    push: false,
    emailFrequency: 'instant',
    browserNotifications: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  useEffect(() => {
    loadPreferences();
  }, []);
  
  const loadPreferences = async () => {
    try {
      setLoading(true);
      const userPreferences = await getUserNotificationPreferences();
      setPreferences(userPreferences);
    } catch (error) {
      console.error("Error loading notification preferences:", error);
      toast.error("Errore nel caricamento delle preferenze di notifica");
    } finally {
      setLoading(false);
    }
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    
    setPreferences({
      ...preferences,
      [name]: newValue
    });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      await updateNotificationPreferences(preferences);
      toast.success("Preferenze di notifica aggiornate con successo");
    } catch (error) {
      console.error("Error updating notification preferences:", error);
      toast.error("Errore nell'aggiornamento delle preferenze di notifica");
    } finally {
      setSaving(false);
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
  
  const requestPushPermission = async () => {
    try {
      if (!('Notification' in window)) {
        toast.error("Il tuo browser non supporta le notifiche push");
        return;
      }
      
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        setPreferences({
          ...preferences,
          push: true
        });
        toast.success("Notifiche push attivate con successo");
      } else {
        toast.error("Permesso per le notifiche push negato");
      }
    } catch (error) {
      console.error("Error requesting push permission:", error);
      toast.error("Errore nella richiesta delle notifiche push");
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link to="/profile" className="flex items-center text-blue-600 hover:text-blue-800">
            <ArrowLeft className="h-4 w-4 mr-1" />
            <span>Torna al profilo</span>
          </Link>
        </div>
        
        <h1 className="text-2xl font-bold text-slate-800 mb-6">Preferenze di notifica</h1>
        
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-8">
              <div className="border-b border-slate-200 pb-6">
                <h2 className="text-lg font-medium text-slate-800 mb-4">Canali di notifica</h2>
                <p className="text-slate-600 mb-4">
                  Scegli come vuoi ricevere le notifiche per le tue ricerche salvate.
                </p>
                
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="email"
                        name="email"
                        type="checkbox"
                        checked={preferences.email}
                        onChange={handleChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                      />
                    </div>
                    <div className="ml-3">
                      <label htmlFor="email" className="font-medium text-slate-800 flex items-center">
                        <Mail className="h-5 w-5 mr-2 text-blue-600" />
                        Email
                      </label>
                      <p className="text-sm text-slate-600">
                        Ricevi notifiche via email all'indirizzo {user?.email}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="push"
                        name="push"
                        type="checkbox"
                        checked={preferences.push}
                        onChange={handleChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                      />
                    </div>
                    <div className="ml-3">
                      <label htmlFor="push" className="font-medium text-slate-800 flex items-center">
                        <Smartphone className="h-5 w-5 mr-2 text-blue-600" />
                        Notifiche push
                      </label>
                      <p className="text-sm text-slate-600">
                        Ricevi notifiche push sul browser o dispositivo mobile
                      </p>
                      {!preferences.push && (
                        <button
                          type="button"
                          onClick={requestPushPermission}
                          className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                        >
                          Attiva notifiche push
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="browserNotifications"
                        name="browserNotifications"
                        type="checkbox"
                        checked={preferences.browserNotifications}
                        onChange={handleChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                      />
                    </div>
                    <div className="ml-3">
                      <label htmlFor="browserNotifications" className="font-medium text-slate-800 flex items-center">
                        <Bell className="h-5 w-5 mr-2 text-blue-600" />
                        Notifiche browser
                      </label>
                      <p className="text-sm text-slate-600">
                        Visualizza notifiche quando sei sul sito
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h2 className="text-lg font-medium text-slate-800 mb-4">Frequenza email</h2>
                <p className="text-slate-600 mb-4">
                  Scegli quanto spesso vuoi ricevere email di notifica per le tue ricerche.
                </p>
                
                <div className="max-w-xs">
                  <select
                    id="emailFrequency"
                    name="emailFrequency"
                    value={preferences.emailFrequency}
                    onChange={handleChange}
                    className="block w-full py-2 px-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="instant">Immediate (per ogni nuovo annuncio)</option>
                    <option value="daily">Riassunto giornaliero</option>
                    <option value="weekly">Riassunto settimanale</option>
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center py-2 px-6 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-70"
                >
                  {saving ? (
                    <>
                      <Loader2 className="animate-spin h-4 w-4 mr-2" />
                      Salvataggio...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Salva preferenze
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NotificationPreferences;