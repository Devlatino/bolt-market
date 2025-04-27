import { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { login as apiLogin, register as apiRegister, logout as apiLogout, updateProfile as apiUpdateProfile, getCurrentUser } from '../services/authService';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (email: string, password: string, name: string) => Promise<User>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    const checkAuthStatus = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (active) {
          setUser(currentUser);
        }
      } catch (error) {
        if (active) {
          console.error("Auth status check error:", error);
          setUser(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    
    checkAuthStatus();

    return () => {
      active = false;
      controller.abort();
    };
  }, []);
  
  const login = async (email: string, password: string) => {
    const loggedInUser = await apiLogin(email, password);
    setUser(loggedInUser);
    return loggedInUser;
  };
  
  const register = async (email: string, password: string, name: string) => {
    const registeredUser = await apiRegister(email, password, name);
    setUser(registeredUser);
    return registeredUser;
  };
  
  const logout = async () => {
    await apiLogout();
    setUser(null);
    navigate('/');
  };
  
  const updateProfile = async (data: Partial<User>) => {
    const updatedUser = await apiUpdateProfile(data);
    setUser(updatedUser);
  };
  
  const value = useMemo(() => ({
    user,
    loading,
    login,
    register,
    logout,
    updateProfile
  }), [user, loading]);
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};