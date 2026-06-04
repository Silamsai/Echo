import { useState, useEffect, useRef } from 'react';
import { Settings as SettingsIcon, Bell, Shield, Sun, Moon, Volume2, Monitor, Eye, Camera, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import axiosInstance from '../utils/axiosInstance';

const Settings = () => {
  const { user, updateUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState('general');

  // Profile Edit Form States
  const [profileForm, setProfileForm] = useState({ username: user?.username || '', bio: user?.bio || '', nickname: user?.nickname || '' });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const fileRef = useRef(null);

  // Sync profile details when user changes
  useEffect(() => {
    if (user) {
      setProfileForm({ username: user.username || '', bio: user.bio || '', nickname: user.nickname || '' });
      setAvatarPreview(user.avatar || '');
    }
  }, [user]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error('Image must be under 5MB.');
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSaveProfile = async () => {
    setIsUpdatingProfile(true);
    try {
      const formData = new FormData();
      if (profileForm.username !== user?.username) formData.append('username', profileForm.username);
      if (profileForm.bio !== user?.bio) formData.append('bio', profileForm.bio);
      if (profileForm.nickname !== user?.nickname) formData.append('nickname', profileForm.nickname);
      if (avatarFile) formData.append('avatar', avatarFile);

      const { data } = await axiosInstance.put('/user/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      updateUser(data);
      setAvatarFile(null);
      toast.success('Profile updated! ✅');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed.');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Load preferences from localStorage or defaults
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const val = localStorage.getItem('setting_sound');
    return val === null ? true : val === 'true';
  });
  const [desktopNotif, setDesktopNotif] = useState(() => {
    const val = localStorage.getItem('setting_desktop_notif');
    return val === null ? true : val === 'true';
  });
  const [showTyping, setShowTyping] = useState(() => {
    const val = localStorage.getItem('setting_show_typing');
    return val === null ? true : val === 'true';
  });

  // Handle theme changes
  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    toast.success(`${newTheme.charAt(0).toUpperCase() + newTheme.slice(1)} theme enabled`);
  };

  // Sync states to localStorage
  useEffect(() => {
    localStorage.setItem('setting_sound', soundEnabled);
  }, [soundEnabled]);

  useEffect(() => {
    localStorage.setItem('setting_desktop_notif', desktopNotif);
  }, [desktopNotif]);

  useEffect(() => {
    localStorage.setItem('setting_show_typing', showTyping);
  }, [showTyping]);

  const getAvatar = () =>
    user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`;

  return (
    <div className="flex-grow flex flex-col h-full bg-[#0a0a0f] text-[#e8e6ff] font-sans select-none overflow-hidden fade-in">
      
      {/* Header bar */}
      <div className="px-6 py-5 border-b border-white/5 bg-[#0b0b13] flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <SettingsIcon size={18} className="text-[#7c6dfa]" />
          <h1 className="text-sm font-extrabold tracking-tight uppercase font-mono">System Preferences</h1>
        </div>
        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">v1.2.0</span>
      </div>

      {/* Main content body split layout */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Column: Vertical macOS System Preferences Sidebar */}
        <div className="w-[180px] md:w-[220px] border-r border-white/5 bg-[#0a0a0f] py-4 px-2 space-y-1.5 flex-shrink-0 overflow-y-auto">
          <button
            onClick={() => setActiveTab('general')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'general'
                ? 'bg-white/5 text-white border border-white/10 shadow-inner'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Sun size={14} className={activeTab === 'general' ? 'text-[#7c6dfa]' : 'text-slate-500'} />
            Appearance
          </button>
          
          <button
            onClick={() => setActiveTab('notifications')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'notifications'
                ? 'bg-white/5 text-white border border-white/10 shadow-inner'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Bell size={14} className={activeTab === 'notifications' ? 'text-[#fa6d9b]' : 'text-slate-500'} />
            Notifications
          </button>
          
          <button
            onClick={() => setActiveTab('account')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'account'
                ? 'bg-white/5 text-white border border-white/10 shadow-inner'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Shield size={14} className={activeTab === 'account' ? 'text-green-400' : 'text-slate-500'} />
            Security & Identity
          </button>
        </div>

        {/* Right Column: Active Configuration Form */}
        <div className="flex-grow p-6 md:p-8 bg-[#111118] overflow-y-auto">
          <div className="max-w-[520px] space-y-6">

            {/* ──────── TABS ──────── */}
            {activeTab === 'general' && (
              <div className="space-y-6 animate-slide-in-right">
                <div>
                  <h2 className="text-base font-extrabold text-white mb-1">Theme Preferences</h2>
                  <p className="text-slate-500 text-[11px] leading-normal font-mono max-w-sm">Choose the window appearance of your Echo messaging workspace.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Dark Theme Button */}
                  <button
                    onClick={() => handleThemeChange('dark')}
                    className={`flex flex-col gap-3 p-4 rounded-xl text-left border cursor-pointer transition-all duration-150 relative ${
                      theme === 'dark'
                        ? 'border-[#7c6dfa] bg-[#7c6dfa]/5 shadow-lg shadow-indigo-500/5'
                        : 'border-white/5 bg-[#16161f] hover:border-white/10'
                    }`}
                  >
                    <div className="w-full h-20 rounded-lg bg-[#0a0a0f] border border-white/5 p-2 flex flex-col justify-between overflow-hidden">
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
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
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
                        : 'border-white/5 bg-[#16161f] hover:border-white/10'
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
                      <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
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
                  <h2 className="text-base font-extrabold text-white mb-1">Notification Options</h2>
                  <p className="text-slate-500 text-[11px] leading-normal font-mono max-w-sm">Configure how incoming signals, requests, and updates alert your device.</p>
                </div>

                <div className="divide-y divide-white/5 border border-white/5 rounded-xl bg-[#16161f] overflow-hidden">
                  {/* Desktop Notifs */}
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-start gap-3.5 max-w-[80%]">
                      <Monitor className="text-[#7c6dfa] flex-shrink-0 mt-0.5" size={16} />
                      <div>
                        <p className="text-xs font-bold text-white">Desktop Banner Alerts</p>
                        <p className="text-[10px] text-slate-500 leading-relaxed font-mono mt-0.5">Show native OS push notification banners when messages arrive in background.</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDesktopNotif(!desktopNotif)}
                      className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors flex-shrink-0 cursor-pointer ${
                        desktopNotif ? 'bg-[#7c6dfa]' : 'bg-white/10'
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
                        <p className="text-xs font-bold text-white">Sound Effects</p>
                        <p className="text-[10px] text-slate-500 leading-relaxed font-mono mt-0.5">Play audio echoes on incoming messages, sent triggers, and request alerts.</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSoundEnabled(!soundEnabled)}
                      className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors flex-shrink-0 cursor-pointer ${
                        soundEnabled ? 'bg-[#7c6dfa]' : 'bg-white/10'
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
                        <p className="text-xs font-bold text-white">Share Typing Presence</p>
                        <p className="text-[10px] text-slate-500 leading-relaxed font-mono mt-0.5">Broadcast active typing states to other members in channels during conversation.</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowTyping(!showTyping)}
                      className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors flex-shrink-0 cursor-pointer ${
                        showTyping ? 'bg-[#7c6dfa]' : 'bg-white/10'
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
                  <h2 className="text-base font-extrabold text-white mb-1">Security & Identity</h2>
                  <p className="text-slate-500 text-[11px] leading-normal font-mono max-w-sm">Manage security attributes, verified credentials, and update your profile details.</p>
                </div>

                {/* Profile Card & Photo Editor */}
                <div className="flex flex-col sm:flex-row items-center gap-5 p-5 border border-white/5 bg-[#16161f] rounded-xl">
                  {/* Photo Edit */}
                  <div className="relative group flex-shrink-0 cursor-pointer" onClick={() => fileRef.current?.click()}>
                    <img
                      src={avatarPreview || getAvatar()}
                      alt="avatar"
                      className="w-20 h-20 rounded-2xl object-cover border border-white/10 group-hover:border-[#7c6dfa] transition-all duration-200"
                    />
                    <div className="absolute inset-0 rounded-2xl bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                      <Camera size={18} className="text-white" />
                      <span className="text-[8px] text-slate-300 uppercase font-bold tracking-wider">Change</span>
                    </div>
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                  </div>

                  <div className="min-w-0 flex-1 text-center sm:text-left">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-center sm:justify-start">
                      <p className="text-xs font-extrabold text-white">@{user?.username}</p>
                      <span
                        className="self-center px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider font-mono rounded-full border border-indigo-500/20 bg-indigo-500/10 text-indigo-400"
                      >
                        {user?.isAdmin ? 'ADMIN' : 'MEMBER'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-mono mt-1 truncate">{user?.email}</p>
                    {avatarFile && (
                      <span className="text-[9.5px] text-green-400 font-mono block mt-1">✓ New photo selected</span>
                    )}
                  </div>
                </div>

                {/* Edit Form */}
                <div className="space-y-4">
                  {/* Username Field */}
                  <div>
                    <label className="text-[10px] font-mono tracking-wider text-slate-400 mb-1.5 block uppercase">Username</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-mono">@</span>
                      <input
                        type="text"
                        className="w-full bg-[#16161f] text-[#e8e6ff] border border-white/5 rounded-lg py-2.5 pl-7 pr-4 text-xs font-sans placeholder-slate-600 outline-none focus:border-[#7c6dfa]/40 transition-all duration-150"
                        value={profileForm.username}
                        onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
                        placeholder="username"
                      />
                    </div>
                  </div>

                  {/* Nickname Field */}
                  <div>
                    <label className="text-[10px] font-mono tracking-wider text-slate-400 mb-1.5 block uppercase">Nickname</label>
                    <input
                      type="text"
                      className="w-full bg-[#16161f] text-[#e8e6ff] border border-white/5 rounded-lg py-2.5 px-3.5 text-xs font-sans placeholder-slate-600 outline-none focus:border-[#7c6dfa]/40 transition-all duration-150"
                      value={profileForm.nickname || ''}
                      onChange={(e) => setProfileForm({ ...profileForm, nickname: e.target.value })}
                      placeholder="Enter nickname"
                    />
                  </div>

                  {/* Bio Field */}
                  <div>
                    <label className="text-[10px] font-mono tracking-wider text-slate-400 mb-1.5 block uppercase">Bio</label>
                    <textarea
                      className="w-full bg-[#16161f] text-[#e8e6ff] border border-white/5 rounded-lg py-2.5 px-3.5 text-xs font-sans placeholder-slate-600 outline-none focus:border-[#7c6dfa]/40 transition-all duration-150 resize-none"
                      rows={3}
                      value={profileForm.bio}
                      onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                      placeholder="Write a bio..."
                      maxLength={160}
                    />
                    <div className="flex justify-between items-center mt-1 text-[9px] font-mono text-slate-600">
                      <span>Max 160 characters</span>
                      <span>{profileForm.bio.length}/160</span>
                    </div>
                  </div>

                  {/* Save Changes Button */}
                  <button
                    onClick={handleSaveProfile}
                    disabled={isUpdatingProfile}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-bold text-white transition-all cursor-pointer bg-gradient-to-r from-[#7c6dfa] to-[#fa6d9b] hover:opacity-95 disabled:opacity-50"
                  >
                    <Save size={14} />
                    {isUpdatingProfile ? 'Saving Changes...' : 'Save Profile Changes'}
                  </button>
                </div>

                {/* Info blocks */}
                <div className="border border-white/5 rounded-xl bg-[#16161f] divide-y divide-white/5 font-mono text-[10px]">
                  
                  {/* Auth Provider */}
                  <div className="flex justify-between items-center p-3.5">
                    <span className="text-slate-500">PROVIDER</span>
                    <span className="text-slate-300 font-bold">
                      {user?.provider === 'google' ? '🟢 GOOGLE AUTHORIZED' : '📧 EMAIL & PASSWORD'}
                    </span>
                  </div>

                  {/* Joined Date */}
                  {user?.createdAt && (
                    <div className="flex justify-between items-center p-3.5">
                      <span className="text-slate-500">CREATION DATE</span>
                      <span className="text-slate-300">
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

                  {/* Encryption status */}
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
