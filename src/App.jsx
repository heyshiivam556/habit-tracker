import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import Calendar from './pages/Calendar';
import Profile from './pages/Profile';
import ManageHabits from './pages/ManageHabits';

function AppLayout() {
  const location = useLocation();
  const path = location.pathname;

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] transition-colors duration-300 pb-24">
      {/* Main Content Area */}
      <main className="max-w-md mx-auto p-4 sm:p-6 lg:max-w-2xl">
        <header className="mb-8 pt-4">
          <h1 className="text-3xl font-bold tracking-tight">
            {path === '/' && 'Good Morning, Alex'}
            {path === '/calendar' && 'Your Calendar'}
            {path === '/profile' && 'You'}
            {path === '/manage-habits' && 'Manage Habits'}
          </h1>
          {path === '/' && (
            <p className="text-[var(--text-muted)] mt-1 text-sm">Let's make today a good day.</p>
          )}
        </header>

        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/calendar" element={<Calendar />} />
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
