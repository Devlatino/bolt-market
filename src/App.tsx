import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import HomePage from './components/home/HomePage';
import SearchResults from './components/search/SearchResults';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ProfilePage from './components/profile/ProfilePage';
import SavedSearches from './components/profile/SavedSearches';
import NotificationPreferences from './components/profile/NotificationPreferences';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="flex flex-col min-h-screen bg-slate-50">
          <Header />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/search" element={<SearchResults />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              } />
              <Route path="/saved-searches" element={
                <ProtectedRoute>
                  <SavedSearches />
                </ProtectedRoute>
              } />
              <Route path="/notification-preferences" element={
                <ProtectedRoute>
                  <NotificationPreferences />
                </ProtectedRoute>
              } />
            </Routes>
          </main>
          <Footer />
        </div>
        <Toaster position="top-center" />
      </Router>
    </AuthProvider>
  );
}

export default App;