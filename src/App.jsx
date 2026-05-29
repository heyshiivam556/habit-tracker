import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navigation from './components/Navigation';
import Dashboard from './pages/Dashboard';
import Analytics from './pages/Analytics';
import { useAuth } from './hooks/useAuth';
import Profile from './pages/Profile';
import ManageHabits from './pages/ManageHabits';
import { useHabits } from './hooks/useHabits';
import { syncToGoogleSheets } from './utils/googleSheets';

function AppLayout() {
  const location = useLocation();
  const path = location.pathname;
  const { user, googleToken } = useAuth();
  const { habits } = useHabits();
  
  const firstName = user?.displayName ? user.displayName.split(' ')[0] : 'Alex';

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const savedAccent = localStorage.getItem('accent') || 'beige';
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    document.documentElement.setAttribute('data-theme', savedAccent);

    const savedGlass = localStorage.getItem('glass') === 'true';
    if (savedGlass) {
      document.documentElement.classList.add('glass');
    } else {
      document.documentElement.classList.remove('glass');
    }

    const savedBg = localStorage.getItem('glass-bg');
    if (savedBg) {
      document.documentElement.style.setProperty('--glass-bg-image', `url(${savedBg})`);
    } else {
      document.documentElement.style.removeProperty('--glass-bg-image');
    }
  }, []);

  // Background Google Sheets weekly auto-sync
  useEffect(() => {
    if (googleToken && habits && habits.length > 0) {
      const lastSync = localStorage.getItem('last_sheets_sync');
      const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
      if (!lastSync || Date.now() - parseInt(lastSync) > SEVEN_DAYS) {
        console.log("Initiating background Google Sheets sync...");
        syncToGoogleSheets(googleToken, habits)
          .then(() => {
            localStorage.setItem('last_sheets_sync', Date.now().toString());
            console.log("Background Google Sheets sync completed.");
          })
          .catch(err => {
            console.error("Background sync failed:", err);
          });
      }
    }
  }, [googleToken, habits]);

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] transition-colors duration-300 pb-24">
      {/* Main Content Area */}
      <main className="max-w-md mx-auto p-4 sm:p-6 lg:max-w-2xl">
        <header className="mb-8 pt-4">
          <h1 className="text-3xl font-bold tracking-tight">
            {path === '/' && `Good Morning, ${firstName}`}
            {path === '/analytics' && 'Analytics'}
            {path === '/profile' && 'You'}
            {path === '/manage-habits' && 'Manage Habits'}
          </h1>
          {path === '/' && (
            <p className="text-[var(--text-muted)] mt-1 text-sm">Let's make today a good day.</p>
          )}
        </header>

        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/manage-habits" element={<ManageHabits />} />
        </Routes>
      </main>

      {/* Floating Navigation */}
      <Navigation />
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
}

export default App;
