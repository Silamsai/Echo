import { useEffect, useState, useRef } from 'react';
import { MessageSquare, Search, Bell, User, Shield, Settings } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import useChatStore from '../store/chatStore';
import useNotificationStore from '../store/notificationStore';
import axiosInstance from '../utils/axiosInstance';
import ConversationItem from './ConversationItem';

/* ─── Echo Logo Mark (matching signup page) ─── */
const EchoMark = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    <defs>
      <linearGradient id="sb-logo-g" x1="20%" y1="10%" x2="80%" y2="90%">
        <stop offset="0%" stopColor="#6eb5ff" />
        <stop offset="50%" stopColor="#7b6ef6" />
        <stop offset="100%" stopColor="#5956e9" />
      </linearGradient>
    </defs>
    <path d="M50 12C73.2 12 92 30.8 92 54C92 77.2 73.2 96 50 96C41 96 32.6 93.2 25.8 88.3C15.6 93.3 7.5 95.5 6.7 95.6C5.9 95.7 5.1 95 5.3 94.1C5.9 91.3 8.7 81.4 12.8 73.9C8.3 67.9 5.7 60.3 5.7 54C5.7 30.8 26.8 12 50 12Z" fill="url(#sb-logo-g)" />
    <path d="M50 34C38.4 34 29 43.4 29 55C29 66.6 38.4 76 50 76C58.6 76 66 71 69.2 63.6L57.8 63.6C55.6 66.9 53 68 50 68C44.4 68 39.8 63.8 39 58L71 58C71 57 71 56 71 55C71 43.4 61.6 34 50 34ZM50 42C54 42 57.2 44.8 58.6 48.6L41.4 48.6C42.8 44.8 46 42 50 42Z" fill="#ffffff" />
  </svg>
);

/* ─── Hamburger Icon ─── */
const HamburgerIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

/* ─── Close Icon ─── */
const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const Sidebar = ({ onSelectConversation, activeConversation }) => {
  const { user, logout } = useAuthStore();
  const { conversations, setConversations, activeConversation: storeActive, setActiveConversation } = useChatStore();
  const { unreadCount } = useNotificationStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    axiosInstance.get('/conversation').then(({ data }) => setConversations(data)).catch(() => {});
  }, [setConversations]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  const filtered = conversations.filter((c) => {
    const other = c.participants?.find((p) => p._id !== user?._id);
    return other?.username?.toLowerCase().includes(search.toLowerCase());
  });

  const navItems = [
    { icon: MessageSquare, label: 'Chats', path: '/', emoji: '💬' },
    { icon: Search, label: 'Search People', path: '/search', emoji: '🔍' },
    { icon: Bell, label: 'Requests', path: '/notifications', badge: unreadCount, emoji: '🔔' },
    { icon: User, label: 'My Profile', path: '/profile', emoji: '👤' },
    { icon: Settings, label: 'Settings', path: '/settings', emoji: '⚙️' },
    ...(user?.isAdmin ? [{ icon: Shield, label: 'Admin Panel', path: '/admin', emoji: '🛡️' }] : []),
  ];

  const getAvatar = () =>
    user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`;

  const currentActive = activeConversation || storeActive;

  const handleSelectConv = (conv) => {
    setActiveConversation(conv);
    if (onSelectConversation) onSelectConversation(conv);
    if (location.pathname !== '/') navigate('/');
  };

  const handleNav = (path) => {
    setMenuOpen(false);
    navigate(path);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="sidebar flex flex-col h-full w-full md:w-[280px] border-r border-white/5 select-none bg-[#111118]" style={{ position: 'relative' }}>

      {/* Brand Header */}
      <div className="px-4 md:px-5 pt-4 md:pt-5 pb-3 border-b border-white/5 flex items-center">
        {/* Logo + Text */}
        <div className="flex items-center gap-2 cursor-pointer w-full" onClick={() => navigate('/')}>
          <EchoMark size={28} />
          <div>
            <div
              className="leading-none font-black tracking-tight"
              style={{
                fontSize: '18px',
                background: 'linear-gradient(90deg, #7b6ef6, #6eb5ff)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                fontFamily: '"Inter", -apple-system, sans-serif',
              }}
            >
              echo
            </div>
            <div className="text-[8px] font-mono text-slate-500 tracking-[1.5px] uppercase mt-0.5">Chat · Connect · Repeat</div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="px-3 md:px-4 py-3" style={{ position: 'relative' }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ position: 'absolute', left: '24px', top: '50%', transform: 'translateY(-50%)', color: '#4b5563', pointerEvents: 'none' }}>
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          type="text"
          className="w-full bg-[#16161f] text-[#e8e6ff] border border-white/5 rounded-lg py-2 pr-4 text-[11px] placeholder-slate-600 font-mono outline-none focus:border-[#7b6ef6]/40 transition-all duration-150"
          style={{ paddingLeft: '2rem' }}
          placeholder="Search chats..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Section label */}
      <div className="font-mono text-[9px] tracking-[2px] text-slate-500 uppercase px-4 pt-1 pb-1">
        Channels
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-600 text-[11px] font-mono">
            {conversations.length === 0 ? (
              <div className="px-4">
                <div className="text-3xl mb-2">📡</div>
                <p className="font-semibold text-slate-500">No active chats</p>
                <p className="text-[9px] text-slate-600 mt-1">Search for users and start a chat</p>
              </div>
            ) : (
              <p>No chats found</p>
            )}
          </div>
        )}
        {filtered.map((conv) => (
          <ConversationItem
            key={conv._id}
            conversation={conv}
            isActive={currentActive?._id === conv._id}
            onClick={() => handleSelectConv(conv)}
          />
        ))}
      </div>

      {/* User bar at bottom */}
      <div className="p-3 border-t border-white/5 bg-[#0b0b13] flex items-center justify-between relative" ref={menuRef}>
        {/* Left: Echo Logo Button (toggles menu/popup) */}
        <button
          onClick={() => setMenuOpen(o => !o)}
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer ${
            menuOpen
              ? 'bg-gradient-to-tr from-[#7b6ef6]/20 to-[#5956e9]/20 border border-[#7b6ef6]/40 shadow-[0_0_15px_rgba(123,110,246,0.25)]'
              : 'border border-transparent hover:border-white/10 hover:bg-white/5'
          }`}
          title="Open Menu"
        >
          <EchoMark size={26} />
        </button>

        {/* Floating macOS Control Center Popup */}
        {menuOpen && (
          <div
            className="animate-mac-pop"
            style={{
              position: 'absolute',
              bottom: '52px',
              left: '12px',
              width: '240px',
              background: 'rgba(19, 19, 30, 0.82)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '16px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.55)',
              zIndex: 100,
              overflow: 'hidden',
              fontFamily: '"Inter", -apple-system, sans-serif',
            }}
          >
            {/* macOS User Account Widget */}
            <div style={{ padding: '16px 16px 12px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <img
                src={getAvatar()}
                alt=""
                style={{ width: '40px', height: '40px', borderRadius: '12px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }}
              />
              <div style={{ minWidth: 0, flex: 1 }}>
                <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.nickname || user?.username}
                </h4>
                <p style={{ margin: '2px 0 0', fontSize: '10px', fontFamily: 'monospace', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  {user?.isAdmin ? '💻 Admin' : '👤 Member'}
                </p>
              </div>
            </div>

            {/* Macbook-Style Control Buttons */}
            <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {navItems.map(({ emoji, label, path, badge }) => {
                const isActive = location.pathname === path;
                return (
                  <button
                    key={path}
                    onClick={() => handleNav(path)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '10px',
                      background: isActive
                        ? 'linear-gradient(135deg, rgba(123, 110, 246, 0.22), rgba(89, 86, 233, 0.22))'
                        : 'rgba(255,255,255,0.03)',
                      border: isActive
                        ? '1px solid rgba(123, 110, 246, 0.4)'
                        : '1px solid rgba(255,255,255,0.04)',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
                      color: isActive ? '#ffffff' : '#a1a1aa',
                      fontSize: '12px',
                      fontWeight: isActive ? 600 : 500,
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                    className="mac-nav-btn"
                  >
                    <span style={{ fontSize: '14px', filter: isActive ? 'drop-shadow(0 0 4px rgba(123,110,246,0.5))' : 'none' }}>{emoji}</span>
                    <span style={{ flex: 1 }}>{label}</span>
                    {badge > 0 && (
                      <span
                        style={{
                          background: 'linear-gradient(135deg,#7b6ef6,#5956e9)',
                          color: '#fff',
                          fontSize: '9px',
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: '99px',
                          boxShadow: '0 2px 4px rgba(123,110,246,0.3)',
                        }}
                      >
                        {badge > 9 ? '9+' : badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Right: Logout Button */}
        <button
          id="logout-bottom-btn"
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150 cursor-pointer border border-white/5 hover:border-red-500/20"
          title="Log Out"
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Log out
        </button>
      </div>

      <style>{`
        @keyframes macPop {
          0% {
            opacity: 0;
            transform: translateY(12px) scale(0.95);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-mac-pop {
          animation: macPop 0.22s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          transform-origin: bottom left;
        }
        .mac-nav-btn {
          transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .mac-nav-btn:hover {
          background: rgba(255, 255, 255, 0.08) !important;
          border-color: rgba(255, 255, 255, 0.12) !important;
          color: #ffffff !important;
          transform: scale(1.03);
        }
        .mac-nav-btn:active {
          transform: scale(0.97);
        }
      `}</style>
    </div>
  );
};

export default Sidebar;
