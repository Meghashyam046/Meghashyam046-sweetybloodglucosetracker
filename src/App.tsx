import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import AuthScreen from './components/AuthScreen';
import Dashboard from './components/Dashboard';
import { fetchMe } from './services/api';
import { UserProfile } from './types';

const TOKEN_STORAGE_KEY = 'sweety_token';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function restoreSession() {
      const saved = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (!saved) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetchMe(saved);
        setCurrentUser({ ...res.user, token: saved });
        setToken(saved);
      } catch {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
      } finally {
        setLoading(false);
      }
    }
    restoreSession();
  }, []);

  const handleLoginSuccess = (user: UserProfile) => {
    const userToken = user.token || null;
    if (userToken) {
      localStorage.setItem(TOKEN_STORAGE_KEY, userToken);
    }
    setToken(userToken);
    setCurrentUser(user);
  };

  const handleLogout = () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken(null);
    setCurrentUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-7 h-7 text-teal-700 animate-spin" />
        <p className="text-sm text-slate-600">Loading your glucose logbook...</p>
      </div>
    );
  }

  if (!currentUser || !token) {
    return <AuthScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <Dashboard
      currentUser={currentUser}
      token={token}
      onUserUpdated={setCurrentUser}
      onLogout={handleLogout}
    />
  );
}
