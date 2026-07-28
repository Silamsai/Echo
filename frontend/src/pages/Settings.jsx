import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings as SettingsIcon, Bell, Shield, Sun, Moon, Volume2, Monitor, Eye, UserCircle, ArrowRight, Mail, Fingerprint } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import {
  getBooleanPreference,
  preferenceKeys,
  requestDesktopNotificationPermission,
  setBooleanPreference,
} from '../utils/userPreferences';

const Settings = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('general');

  // Load preferences from localStorage or defaults
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const [soundEnabled, setSoundEnabled] = useState(() =>
    getBooleanPreference(preferenceKeys.sound, true)
  );
  const [desktopNotif, setDesktopNotif] = useState(() =>
    getBooleanPreference(preferenceKeys.desktopNotifications, true)
  );
  const [showTyping, setShowTyping] = useState(() =>
    getBooleanPreference(preferenceKeys.showTyping, true)
  );

  // Handle theme changes — toggles both 'light' and 'dark' classes
  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    if (newTheme === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    }
    toast.success(`${newTheme.charAt(0).toUpperCase() + newTheme.slice(1)} theme enabled`);
  };

  useEffect(() => {
    setBooleanPreference(preferenceKeys.sound, soundEnabled);
  }, [soundEnabled]);

  useEffect(() => {
    setBooleanPreference(preferenceKeys.desktopNotifications, desktopNotif);
  }, [desktopNotif]);

  useEffect(() => {
    setBooleanPreference(preferenceKeys.showTyping, showTyping);
  }, [showTyping]);

  const getAvatar = () =>
    user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`;

  const handleDesktopNotifToggle = async () => {
    const nextValue = !desktopNotif;
    setDesktopNotif(nextValue);

    if (!nextValue) return;

    const result = await requestDesktopNotificationPermission();
    if (!result.supported) {
      toast.error('Desktop notifications are not supported in this browser.');
      setDesktopNotif(false);
      return;
    }

    if (!result.granted) {
      toast.error('Browser notification permission is blocked.');
      setDesktopNotif(false);
      return;
    }

    toast.success('Desktop notifications enabled.');
  };

  return (
    <div className="flex-grow flex flex-col h-full bg-app text-pri font-sans select-none overflow-hidden fade-in">
      
      {/* Header bar */}
      <div className="px-6 py-5 border-b border-pri bg-navbar flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <SettingsIcon size={18} className="text-[#7c6dfa]" />
          <h1 className="text-sm font-extrabold tracking-tight uppercase font-mono">System Preferences</h1>
        </div>
        <span className="text-[10px] font-mono text-mute uppercase tracking-widest">v1.2.0</span>
      </div>

      {/* Main content body split layout */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Column: Vertical macOS System Preferences Sidebar */}
        <div className="w-[180px] md:w-[220px] border-r border-pri bg-app py-4 px-2 space-y-1.5 flex-shrink-0 overflow-y-auto">
          <button
            onClick={() => setActiveTab('general')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'general'
                ? 'bg-hover text-pri border border-pri shadow-inner'
                : 'text-mute hover:text-pri hover:bg-hover'
            }`}
          >
            <Sun size={14} className={activeTab === 'general' ? 'text-[#7c6dfa]' : 'text-slate-500'} />
            Appearance
          </button>
          
          <button
            onClick={() => setActiveTab('notifications')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'notifications'
                ? 'bg-hover text-pri border border-pri shadow-inner'
                : 'text-mute hover:text-pri hover:bg-hover'
            }`}
          >
            <Bell size={14} className={activeTab === 'notifications' ? 'text-[#fa6d9b]' : 'text-slate-500'} />
            Notifications
          </button>
          
          <button
            onClick={() => setActiveTab('account')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'account'
                ? 'bg-hover text-pri border border-pri shadow-inner'
                : 'text-mute hover:text-pri hover:bg-hover'
            }`}
          >
            <Shield size={14} className={activeTab === 'account' ? 'text-green-400' : 'text-slate-500'} />
            Security & Identity
          </button>
        </div>

        {/* Right Column: Active Configuration Form */}
        <div className="flex-grow p-6 md:p-8 bg-surface overflow-y-auto">
          <div className="max-w-[520px] space-y-6">

            {/* ──────── TABS ──────── */}
            {activeTab === 'general' && (
              <div className="space-y-6 animate-slide-in-right">
                <div>
                  <h2 className="text-base font-extrabold text-pri mb-1">Theme Preferences</h2>
                  <p className="text-slate-500 text-[11px] leading-normal font-mono max-w-sm">Choose the window appearance of your Echo messaging workspace.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Dark Theme Button */}
                  <button
                    onClick={() => handleThemeChange('dark')}
                    className={`flex flex-col gap-3 p-4 rounded-xl text-left border cursor-pointer transition-all duration-150 relative ${
                      theme === 'dark'
                        ? 'border-[#7c6dfa] bg-[#7c6dfa]/5 shadow-lg shadow-indigo-500/5'
                        : 'border-pri bg-panel hover:border-accent-border'
                    }`}
                  >
                    <div className="w-full h-20 rounded-lg bg-app border border-pri p-2 flex flex-col justify-between overflow-hidden">
                      <div className="flex justify-between items-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400/80" />
                        <span className="w-8 h-2 rounded bg-white/10" />
                      </div>
                      <div className="space-y-1">
                        <div className="w-2/3 h-1 bg-white/10 rounded" />
                        <div className="w-full h-1 bg-white/5 rounded" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between w-full">
                      <span className={`text-xs font-bold flex items-center gap-1.5 ${theme === 'dark' ? 'text-pri' : 'text-sec'}`}>
                        <Moon size={12} className="text-[#7c6dfa]" /> Dark Mode
                      </span>
                      {theme === 'dark' && (
                        <span className="w-1.5 h-1.5 bg-[#7c6dfa] rounded-full" />
                      )}
                    </div>
                  </button>

                  {/* Light Theme Button */}
                  <button
                    onClick={() => handleThemeChange('light')}
                    className={`flex flex-col gap-3 p-4 rounded-xl text-left border cursor-pointer transition-all duration-150 relative ${
                      theme === 'light'
                        ? 'border-[#7c6dfa] bg-[#7c6dfa]/5 shadow-lg shadow-indigo-500/5'
                        : 'border-pri bg-panel hover:border-accent-border'
                    }`}
                  >
                    <div className="w-full h-20 rounded-lg bg-slate-100 border border-slate-200 p-2 flex flex-col justify-between overflow-hidden">
                      <div className="flex justify-between items-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400/80" />
                        <span className="w-8 h-2 rounded bg-slate-300" />
                      </div>
                      <div className="space-y-1">
                        <div className="w-2/3 h-1 bg-slate-300 rounded" />
                        <div className="w-full h-1 bg-slate-200 rounded" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between w-full">
                      <span className={`text-xs font-bold flex items-center gap-1.5 ${theme === 'light' ? 'text-pri' : 'text-sec'}`}>
                        <Sun size={12} className="text-yellow-500" /> Light Mode
                      </span>
                      {theme === 'light' && (
                        <span className="w-1.5 h-1.5 bg-[#7c6dfa] rounded-full" />
                      )}
                    </div>
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6 animate-slide-in-right">
                <div>
                  <h2 className="text-base font-extrabold text-pri mb-1">Notification Options</h2>
                  <p className="text-slate-500 text-[11px] leading-normal font-mono max-w-sm">Configure how incoming messages, contact requests, and updates alert your device.</p>
                </div>

                <div className="divide-y divide-[var(--border-primary)] border border-pri rounded-xl bg-panel overflow-hidden">
                  {/* Desktop Notifs */}
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-start gap-3.5 max-w-[80%]">
                      <Monitor className="text-[#7c6dfa] flex-shrink-0 mt-0.5" size={16} />
                      <div>
                        <p className="text-xs font-bold text-pri">Desktop Banner Alerts</p>
                        <p className="text-[10px] text-slate-500 leading-relaxed font-mono mt-0.5">Show native browser notifications for new messages and connection requests while Echo is in the background.</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleDesktopNotifToggle}
                      className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors flex-shrink-0 cursor-pointer ${
                        desktopNotif ? 'bg-[#7c6dfa]' : 'bg-slate-300 dark:bg-white/10'
                      }`}
                    >
                      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                        desktopNotif ? 'translate-x-[22px]' : 'translate-x-[4px]'
                      }`} />
                    </button>
                  </div>

                  {/* Sound Alerts */}
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-start gap-3.5 max-w-[80%]">
                      <Volume2 className="text-[#fa6d9b] flex-shrink-0 mt-0.5" size={16} />
                      <div>
                        <p className="text-xs font-bold text-pri">Sound Effects</p>
                        <p className="text-[10px] text-slate-500 leading-relaxed font-mono mt-0.5">Play a short chime for new messages and incoming connection requests.</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSoundEnabled(!soundEnabled)}
                      className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors flex-shrink-0 cursor-pointer ${
                        soundEnabled ? 'bg-[#7c6dfa]' : 'bg-slate-300 dark:bg-white/10'
                      }`}
                    >
                      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                        soundEnabled ? 'translate-x-[22px]' : 'translate-x-[4px]'
                      }`} />
                    </button>
                  </div>

                  {/* Typing status */}
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-start gap-3.5 max-w-[80%]">
                      <Eye className="text-green-400 flex-shrink-0 mt-0.5" size={16} />
                      <div>
                        <p className="text-xs font-bold text-pri">Share Typing Presence</p>
                        <p className="text-[10px] text-slate-500 leading-relaxed font-mono mt-0.5">Control whether Echo broadcasts your typing status to other people in conversations.</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowTyping(!showTyping)}
                      className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors flex-shrink-0 cursor-pointer ${
                        showTyping ? 'bg-[#7c6dfa]' : 'bg-slate-300 dark:bg-white/10'
                      }`}
                    >
                      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                        showTyping ? 'translate-x-[22px]' : 'translate-x-[4px]'
                      }`} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'account' && (
              <div className="space-y-6 animate-slide-in-right">
                <div>
                  <h2 className="text-base font-extrabold text-pri mb-1">Security & Identity</h2>
                  <p className="text-slate-500 text-[11px] leading-normal font-mono max-w-sm">Review your account details and jump to the dedicated profile editor when you want to update identity information.</p>
                </div>

                {/* Account summary */}
                <div className="flex flex-col sm:flex-row items-center gap-5 p-5 border border-pri bg-panel rounded-xl">
                  <div className="relative group flex-shrink-0">
                    <img
                      src={getAvatar()}
                      alt="avatar"
                      className="w-20 h-20 rounded-2xl object-cover border border-pri"
                    />
                  </div>

                  <div className="min-w-0 flex-1 text-center sm:text-left">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-center sm:justify-start">
                      <p className="text-xs font-extrabold text-pri">@{user?.username}</p>
                      <span
                        className="self-center px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider font-mono rounded-full border border-indigo-500/20 bg-indigo-500/10 text-indigo-400"
                      >
                        {user?.isAdmin ? 'ADMIN' : 'MEMBER'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-mono mt-1 truncate">{user?.nickname || 'No nickname set'}</p>
                    <p className="text-[10px] text-slate-500 font-mono mt-1 truncate">{user?.email}</p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => navigate('/profile')}
                    className="w-full flex items-center justify-between gap-2 py-3 px-4 rounded-lg text-xs font-bold transition-all cursor-pointer border border-pri bg-panel hover:border-[#7c6dfa]/40"
                  >
                    <span className="flex items-center gap-2">
                      <UserCircle size={14} className="text-[#7c6dfa]" />
                      Edit Profile
                    </span>
                    <ArrowRight size={14} className="text-slate-500" />
                  </button>
                  <div className="w-full flex items-center justify-between gap-2 py-3 px-4 rounded-lg text-xs font-bold border border-pri bg-panel">
                    <span className="flex items-center gap-2">
                      <Fingerprint size={14} className="text-green-400" />
                      Typing visibility
                    </span>
                    <span style={{ color: showTyping ? '#4ade80' : 'var(--text-muted)' }}>
                      {showTyping ? 'Shared' : 'Hidden'}
                    </span>
                  </div>
                </div>

                {/* Info blocks */}
                <div className="border border-pri rounded-xl bg-panel divide-y divide-[var(--border-primary)] font-mono text-[10px]">
                  <div className="flex justify-between items-center p-3.5">
                    <span className="text-slate-500 flex items-center gap-2">
                      <Mail size={12} />
                      CONTACT
                    </span>
                    <span className="text-pri font-bold truncate pl-4">{user?.email}</span>
                  </div>

                  <div className="flex justify-between items-center p-3.5">
                    <span className="text-slate-500">PROVIDER</span>
                    <span className="text-pri font-bold">
                      {user?.provider === 'google' ? 'GOOGLE AUTHORIZED' : 'EMAIL AND PASSWORD'}
                    </span>
                  </div>

                  {/* Joined Date */}
                  {user?.createdAt && (
                    <div className="flex justify-between items-center p-3.5">
                      <span className="text-slate-500">CREATION DATE</span>
                      <span className="text-pri">
                        {new Date(user.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center p-3.5">
                    <span className="text-slate-500">SESSION KEY</span>
                    <span className="text-green-400 font-bold flex items-center gap-1.5">
                      ACTIVE (AES-256)
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
