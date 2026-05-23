import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import ErrorBoundary from './components/ErrorBoundary';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if env variables are present
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'your_supabase_project_url') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50 p-4">
        <div className="max-w-md bg-white p-6 rounded-xl shadow-lg text-center">
          <h1 className="text-xl font-bold text-red-600 mb-2">Konfigurasi Belum Lengkap!</h1>
          <p className="text-gray-600 text-sm mb-4">
            File <b>.env</b> belum dibuat atau isinya masih kosong. Silakan isi URL dan API Key Supabase Anda.
          </p>
          <div className="bg-gray-100 p-3 rounded text-left text-xs font-mono">
            1. Buat file baru bernama <b>.env</b><br/>
            2. Isi VITE_SUPABASE_URL=...<br/>
            3. Isi VITE_SUPABASE_ANON_KEY=...
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route 
            path="/login" 
            element={session ? <Navigate to="/dashboard" /> : <Login />} 
          />
          <Route 
            path="/dashboard" 
            element={session ? <Dashboard /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/" 
            element={<Navigate to={session ? "/dashboard" : "/login"} />} 
          />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
