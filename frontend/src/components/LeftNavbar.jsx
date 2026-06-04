import { useNavigate, useLocation } from 'react-router-dom';
import { MessageSquare, Search, Bell, User, Settings, Shield, LogOut } from 'lucide-react';
import useAuthStore from '../store/authStore';
import useNotificationStore from '../store/notificationStore';
import useConfigStore from '../store/configStore';
import useChatStore from '../store/chatStore';

const EchoMark = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    <defs>
      <linearGradient id="nav-logo-g" x1="20%" y1="10%" x2="80%" y2="90%">
        <stop offset="0%" stopColor="#6eb5ff" />
        <stop offset="50%" stopColor="#7b6ef6" />
        <stop offset="100%" stopColor="#5956e9" />
      </linearGradient>
    </defs>
    <path d="M50 12C73.2 12 92 30.8 92 54C92 77.2 73.2 96 50 96C41 96 32.6 93.2 25.8 88.3C15.6 93.3 7.5 95.5 6.7 95.6C5.9 95.7 5.1 95 5.3 94.1C5.9 91.3 8.7 81.4 12.8 73.9C8.3 67.9 5.7 60.3 5.7 54C5.7 30.8 26.8 12 50 12Z" fill="url(#nav-logo-g)" />
    <path d="M50 34C38.4 34 29 43.4 29 55C29 66.6 38.4 76 50 76C58.6 76 66 71 69.2 63.6L57.8 63.6C55.6 66.9 53 68 50 68C44.4 68 39.8 63.8 39 58L71 58C71 57 71 56 71 55C71 43.4 61.6 34 50 34ZM50 42C54 42 57.2 44.8 58.6 48.6L41.4 48.6C42.8 44.8 46 42 50 42Z" fill="#ffffff" />
  </svg>
);

const LeftNavbar = () => {
  const { user, logout } = useAuthStore();
  const { unreadCount } = useNotificationStore();
  const { config } = useConfigStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    {
      key: 'chats',
      icon: MessageSquare,
      path: '/',
      label: 'Chats',
    },
    {
      key: 'search',
      icon: Search,
      path: '/search',
      label: 'Search',
    },
    {
      key: 'requests',
      icon: Bell,
      path: '/notifications',
      label: 'Requests',
      badge: unreadCount,
    },
    {
      key: 'profile',
      icon: User,
      path: '/profile',
      label: 'Profile',
    },
    {
      key: 'settings',
      icon: Settings,
      path: '/settings',
      label: 'Settings',
    },
    ...(user?.isAdmin
      ? [
          {
            key: 'admin',
            icon: Shield,
            path: '/admin',
            label: 'Admin',
          },
        ]
      : []),
  ];

  const getAvatar = () =>
    user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`;

  const { activeConversation } = useChatStore();
  const showMobileBottomBar = location.pathname !== '/' || !activeConversation;

  return (
    <>
      {/* ─── DESKTOP SIDEBAR RAIL ─── */}
      <div className="hidden md:flex flex-col items-center justify-between py-6 w-[76px] h-full bg-[#0b0b13] border-r border-white/5 select-none flex-shrink-0">
        
        {/* App Logo */}
        <div className="cursor-pointer hover:scale-105 active:scale-95 transition-all duration-150" onClick={() => navigate('/')}>
          {config?.logoUrl ? (
            <img
              src={config.logoUrl}
              alt="Logo"
              className="w-9 h-9 rounded-xl object-contain"
            />
          ) : (
            <EchoMark size={32} />
          )}
        </div>

        {/* Navigation Icons */}
        <div className="flex flex-col gap-5 w-full px-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const CustomIconUrl = config?.sidebarIcons?.[item.key];
            const Icon = item.icon;

            return (
              <button
                key={item.key}
                onClick={() => navigate(item.path)}
                className={`relative group w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-tr from-[#7b6ef6]/15 to-[#5956e9]/15 border border-[#7b6ef6]/30 text-white shadow-[0_0_15px_rgba(123,110,246,0.15)]'
                    : 'border border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
                title={item.label}
              >
                {CustomIconUrl ? (
                  <img
                    src={CustomIconUrl}
                    alt={item.label}
                    className="w-5 h-5 object-contain"
                  />
                ) : (
                  <Icon size={20} className={isActive ? 'text-[#7b6ef6]' : ''} />
                )}

                {/* Badge */}
                {item.badge > 0 && (
                  <span className="absolute top-2.5 right-2.5 min-w-[7px] min-h-[7px] bg-red-500 rounded-full" />
                )}

                {/* Tooltip */}
                <div className="absolute left-[70px] bg-[#1a1a24] text-white text-[10px] font-semibold py-1.5 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg border border-white/5 z-50">
                  {item.label}
                </div>
              </button>
            );
          })}
        </div>

        {/* User profile avatar & Logout */}
        <div className="flex flex-col gap-4 items-center">
          <div className="w-9 h-9 rounded-xl overflow-hidden border border-white/10 cursor-pointer hover:border-indigo-500/50 transition-colors" onClick={() => navigate('/profile')}>
            <img src={getAvatar()} alt="" className="w-full h-full object-cover" />
          </div>
          <button
            onClick={handleLogout}
            className="w-10 h-10 rounded-xl flex items-center justify-center border border-transparent text-slate-500 hover:text-red-400 hover:bg-red-500/5 transition-all cursor-pointer"
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* ─── MOBILE BOTTOM BAR ─── */}
      {showMobileBottomBar && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 h-[64px] bg-[#0b0b13]/95 backdrop-blur-md border-t border-white/5 flex items-center justify-around px-4 z-40 select-none">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const CustomIconUrl = config?.sidebarIcons?.[item.key];
            const Icon = item.icon;

            return (
              <button
                key={item.key}
                onClick={() => navigate(item.path)}
                className={`relative w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 ${
                  isActive ? 'text-[#7b6ef6] scale-105' : 'text-slate-400'
                }`}
              >
                {CustomIconUrl ? (
                  <img
                    src={CustomIconUrl}
                    alt={item.label}
                    className="w-5 h-5 object-contain"
                    style={{ filter: isActive ? 'none' : 'grayscale(1) opacity(0.6)' }}
                  />
                ) : (
                  <Icon size={20} />
                )}

                {/* Badge */}
                {item.badge > 0 && (
                  <span className="absolute top-3.5 right-3.5 min-w-[7px] min-h-[7px] bg-red-500 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </>
  );
};

export default LeftNavbar;
