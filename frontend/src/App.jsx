import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import useAuthStore from './store/authStore';

import Login from './pages/Login';
import Register from './pages/Register';
import VerifyOTP from './pages/VerifyOTP';
import GoogleSuccess from './pages/GoogleSuccess';
import Home from './pages/Home';
import Search from './pages/Search';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import Settings from './pages/Settings';
import Sidebar from './components/Sidebar';

const AppLayout = ({ page: Page }) => {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar onSelectConversation={() => {}} activeConversation={null} />
      <div className="flex-1 overflow-hidden flex flex-col">
        <Page />
      </div>
    </div>
  );
};

const App = () => {
  const { initialize, isInitialized, user } = useAuthStore();

  useEffect(() => {
    initialize();
    // Initialize theme, default to dark
    const theme = localStorage.getItem('theme') || 'dark';
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [initialize]);

  if (!isInitialized) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #08081a 0%, #0d0d22 50%, #0a0818 100%)' }}>
        <div className="text-center fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          {/* Echo Logo Mark */}
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', inset: '-12px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(123,110,246,0.18) 0%, transparent 70%)', animation: 'spin 3s linear infinite' }} />
            <svg width="64" height="64" viewBox="0 0 100 100" fill="none">
              <defs>
                <linearGradient id="splash-g" x1="20%" y1="10%" x2="80%" y2="90%">
                  <stop offset="0%" stopColor="#6eb5ff" />
                  <stop offset="50%" stopColor="#7b6ef6" />
                  <stop offset="100%" stopColor="#5956e9" />
                </linearGradient>
              </defs>
              <path d="M50 12C73.2 12 92 30.8 92 54C92 77.2 73.2 96 50 96C41 96 32.6 93.2 25.8 88.3C15.6 93.3 7.5 95.5 6.7 95.6C5.9 95.7 5.1 95 5.3 94.1C5.9 91.3 8.7 81.4 12.8 73.9C8.3 67.9 5.7 60.3 5.7 54C5.7 30.8 26.8 12 50 12Z" fill="url(#splash-g)" />
              <path d="M50 34C38.4 34 29 43.4 29 55C29 66.6 38.4 76 50 76C58.6 76 66 71 69.2 63.6L57.8 63.6C55.6 66.9 53 68 50 68C44.4 68 39.8 63.8 39 58L71 58C71 57 71 56 71 55C71 43.4 61.6 34 50 34ZM50 42C54 42 57.2 44.8 58.6 48.6L41.4 48.6C42.8 44.8 46 42 50 42Z" fill="#ffffff" />
            </svg>
          </div>
          {/* Brand name */}
          <div style={{ fontSize: '28px', fontWeight: 900, background: 'linear-gradient(90deg, #7b6ef6, #6eb5ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', fontFamily: '"Inter", -apple-system, sans-serif', letterSpacing: '-1px' }}>
            echo
          </div>
          {/* Spinner */}
          <div className="flex items-center gap-2 text-slate-500 text-xs justify-center" style={{ fontFamily: 'monospace', letterSpacing: '1px' }}>
            <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            LOADING
          </div>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1a1a2e',
            color: '#e2e8f0',
            border: '1px solid rgba(99,102,241,0.3)',
            borderRadius: '12px',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#6366f1', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register />} />
        <Route path="/verify-otp" element={user ? <Navigate to="/" replace /> : <VerifyOTP />} />
        <Route path="/google-success" element={<GoogleSuccess />} />

        {/* Protected routes */}
        <Route path="/" element={!user ? <Navigate to="/login" replace /> : <Home />} />
        <Route path="/search" element={<AppLayout page={Search} />} />
        <Route path="/notifications" element={<AppLayout page={Notifications} />} />
        <Route path="/profile" element={<AppLayout page={Profile} />} />
        <Route path="/settings" element={<AppLayout page={Settings} />} />
        <Route path="/admin" element={
          !user ? <Navigate to="/login" replace /> :
          !user?.isAdmin ? <Navigate to="/" replace /> :
          <AppLayout page={Admin} />
        } />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
