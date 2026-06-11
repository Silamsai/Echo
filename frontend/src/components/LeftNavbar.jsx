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
        <stop offset="0%" stopColor="#c4b5fd" />
        <stop offset="50%" stopColor="#7b6ef6" />
        <stop offset="100%" stopColor="#5956e9" />
      </linearGradient>
    </defs>
    <path d="M50 12C73.2 12 92 30.8 92 54C92 77.2 73.2 96 50 96C41 96 32.6 93.2 25.8 88.3C15.6 93.3 7.5 95.5 6.7 95.6C5.9 95.7 5.1 95 5.3 94.1C5.9 91.3 8.7 81.4 12.8 73.9C8.3 67.9 5.7 60.3 5.7 54C5.7 30.8 26.8 12 50 12Z" fill="url(#nav-logo-g)" />
    <path d="M50 34C38.4 34 29 43.4 29 55C29 66.6 38.4 76 50 76C58.6 76 66 71 69.2 63.6L57.8 63.6C55.6 66.9 53 68 50 68C44.4 68 39.8 63.8 39 58L71 58C71 57 71 56 71 55C71 43.4 61.6 34 50 34ZM50 42C54 42 57.2 44.8 58.6 48.6L41.4 48.6C42.8 44.8 46 42 50 42Z" fill="#ffffff" />
  </svg>
);

const NavButton = ({ item, isActive, onClick }) => {
  const Icon = item.icon;
  return (
    <button
      key={item.key}
      onClick={onClick}
      title={item.label}
      style={{
        position: 'relative',
        width: '46px',
        height: '46px',
        borderRadius: '14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        border: isActive
          ? '1px solid rgba(123,110,246,0.35)'
          : '1px solid transparent',
        background: isActive
          ? 'linear-gradient(135deg, rgba(123,110,246,0.18) 0%, rgba(89,86,233,0.12) 100%)'
          : 'transparent',
        color: isActive ? '#a78bfa' : 'rgba(255,255,255,0.35)',
        transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
        boxShadow: isActive ? '0 0 20px rgba(123,110,246,0.2), inset 0 1px 0 rgba(255,255,255,0.1)' : 'none',
        fontFamily: 'inherit',
        outline: 'none',
      }}
      className="ln-nav-btn"
    >
      {Icon && <Icon size={19} />}

      {/* Badge */}
      {item.badge > 0 && (
        <span style={{
          position: 'absolute',
          top: '9px',
          right: '9px',
          width: '7px',
          height: '7px',
          background: '#f87171',
          borderRadius: '50%',
          boxShadow: '0 0 6px rgba(248,113,113,0.6)',
        }} />
      )}

      {/* Tooltip */}
      <div style={{
        position: 'absolute',
        left: 'calc(100% + 12px)',
        top: '50%',
        transform: 'translateY(-50%)',
        background: 'rgba(15,15,22,0.95)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.1)',
        color: 'rgba(255,255,255,0.85)',
        fontSize: '11px',
        fontWeight: 600,
        padding: '5px 10px',
        borderRadius: '8px',
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
        boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
        opacity: 0,
        transition: 'opacity 0.15s',
        zIndex: 100,
      }} className="ln-tooltip">
        {item.label}
      </div>
    </button>
  );
};

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
    { key: 'chats', icon: MessageSquare, path: '/', label: 'Chats' },
    { key: 'search', icon: Search, path: '/search', label: 'Search' },
    { key: 'requests', icon: Bell, path: '/notifications', label: 'Requests', badge: unreadCount },
    { key: 'profile', icon: User, path: '/profile', label: 'Profile' },
    { key: 'settings', icon: Settings, path: '/settings', label: 'Settings' },
    ...(user?.isAdmin ? [{ key: 'admin', icon: Shield, path: '/admin', label: 'Admin' }] : []),
  ];

  const getAvatar = () =>
    user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`;

  const { activeConversation } = useChatStore();
  const showMobileBottomBar = location.pathname !== '/' || !activeConversation;

  return (
    <>
      <style>{`
        .ln-nav-btn:hover {
          background: rgba(255,255,255,0.06) !important;
          color: rgba(255,255,255,0.7) !important;
          border-color: rgba(255,255,255,0.1) !important;
          transform: translateY(-1px);
        }
        .ln-nav-btn:hover .ln-tooltip {
          opacity: 1 !important;
        }
        .ln-nav-btn:active {
          transform: scale(0.93) !important;
        }
        .ln-avatar-wrap:hover {
          border-color: rgba(123,110,246,0.5) !important;
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(123,110,246,0.25) !important;
        }
        .ln-logout-btn:hover {
          color: #f87171 !important;
          background: rgba(248,113,113,0.08) !important;
        }
        .ln-mob-btn:hover { color: rgba(255,255,255,0.7) !important; }
      `}</style>

      {/* ─── DESKTOP RAIL ─── */}
      <div style={{
        display: 'none',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px 0',
        width: '72px',
        height: '100%',
        background: 'rgba(8,8,14,0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        flexShrink: 0,
        userSelect: 'none',
        position: 'relative',
        zIndex: 30,
      }} className="ln-desktop">

        {/* Subtle glow behind rail */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'linear-gradient(180deg, rgba(123,110,246,0.04) 0%, transparent 40%, rgba(123,110,246,0.03) 100%)',
          pointerEvents: 'none',
        }} />

        {/* Logo */}
        <div
          onClick={() => navigate('/')}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px', position: 'relative', zIndex: 1 }}
        >
          {config?.logoUrl ? (
            <img src={config.logoUrl} alt="Logo" style={{ width: '34px', height: '34px', borderRadius: '10px', objectFit: 'contain' }} />
          ) : (
            <EchoMark size={32} />
          )}
        </div>

        {/* Nav items */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', width: '100%', padding: '0 12px', position: 'relative', zIndex: 1 }}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const CustomIconUrl = config?.sidebarIcons?.[item.key];
            const Icon = CustomIconUrl ? null : item.icon;
            const customItem = CustomIconUrl ? { ...item, icon: null } : item;

            return (
              <NavButton
                key={item.key}
                item={customItem}
                isActive={isActive}
                onClick={() => navigate(item.path)}
              />
            );
          })}
        </div>

        {/* Bottom: avatar + logout */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', position: 'relative', zIndex: 1 }}>
          {/* Avatar */}
          <div
            onClick={() => navigate('/profile')}
            className="ln-avatar-wrap"
            style={{
              width: '36px', height: '36px', borderRadius: '11px',
              overflow: 'hidden',
              border: '1.5px solid rgba(255,255,255,0.1)',
              cursor: 'pointer',
              transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            }}
          >
            <img src={getAvatar()} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            title="Logout"
            className="ln-logout-btn"
            style={{
              width: '36px', height: '36px', borderRadius: '11px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid transparent',
              background: 'transparent',
              color: 'rgba(255,255,255,0.25)',
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontFamily: 'inherit',
            }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* ─── MOBILE BOTTOM BAR ─── */}
      {showMobileBottomBar && (
        <div style={{
          position: 'fixed',
          bottom: 0, left: 0, right: 0,
          height: '64px',
          background: 'rgba(8,8,14,0.96)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          padding: '0 8px',
          zIndex: 40,
          userSelect: 'none',
        }} className="ln-mobile">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const CustomIconUrl = config?.sidebarIcons?.[item.key];
            const Icon = item.icon;

            return (
              <button
                key={item.key}
                onClick={() => navigate(item.path)}
                className="ln-mob-btn"
                style={{
                  position: 'relative',
                  width: '48px', height: '48px',
                  borderRadius: '14px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isActive ? 'rgba(123,110,246,0.12)' : 'transparent',
                  border: isActive ? '1px solid rgba(123,110,246,0.25)' : '1px solid transparent',
                  color: isActive ? '#a78bfa' : 'rgba(255,255,255,0.35)',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  fontFamily: 'inherit',
                  outline: 'none',
                  transform: isActive ? 'translateY(-2px)' : 'none',
                }}
              >
                {CustomIconUrl ? (
                  <img src={CustomIconUrl} alt={item.label} style={{ width: '20px', height: '20px', objectFit: 'contain', filter: isActive ? 'none' : 'grayscale(1) opacity(0.5)' }} />
                ) : (
                  <Icon size={20} />
                )}
                {item.badge > 0 && (
                  <span style={{ position: 'absolute', top: '10px', right: '10px', width: '7px', height: '7px', background: '#f87171', borderRadius: '50%', boxShadow: '0 0 6px rgba(248,113,113,0.6)' }} />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Show desktop only on md+ */}
      <style>{`
        @media (min-width: 768px) {
          .ln-desktop { display: flex !important; }
          .ln-mobile  { display: none !important; }
        }
        @media (max-width: 767px) {
          .ln-desktop { display: none !important; }
        }
      `}</style>
    </>
  );
};

export default LeftNavbar;
