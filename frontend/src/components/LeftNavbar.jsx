import { useNavigate, useLocation } from 'react-router-dom';
import { MessageSquare, Search, Bell, User, Settings, Shield, LogOut, Plus, Home, Building2 } from 'lucide-react';
import { BsPinAngleFill, BsVolumeMuteFill, BsTrash3Fill, BsBoxArrowRight } from 'react-icons/bs';
import axiosInstance from '../utils/axiosInstance';
import useAuthStore from '../store/authStore';
import useNotificationStore from '../store/notificationStore';
import useConfigStore from '../store/configStore';
import useChatStore from '../store/chatStore';
import useWorkspaceStore from '../store/workspaceStore';
import { useEffect, useState } from 'react';
import WorkspaceModal from './WorkspaceModal';

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
  const highlight = item.highlight;
  const customIconUrl = item.customIconUrl;
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
        border: highlight
          ? '1px solid var(--accent-border)'
          : isActive
            ? '1px solid var(--accent-border)'
            : '1px solid transparent',
        background: highlight
          ? 'linear-gradient(135deg, var(--accent) 0%, #5956e9 100%)'
          : isActive
            ? 'linear-gradient(135deg, var(--accent-glow) 0%, rgba(89,86,233,0.06) 100%)'
            : 'transparent',
        color: highlight ? '#ffffff' : isActive ? 'var(--accent)' : 'var(--ln-btn-color)',
        transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
        boxShadow: highlight
          ? '0 4px 16px rgba(123,110,246,0.45)'
          : isActive
            ? '0 0 20px rgba(123,110,246,0.2), inset 0 1px 0 rgba(255,255,255,0.1)'
            : 'none',
        fontFamily: 'inherit',
        outline: 'none',
      }}
      className="ln-nav-btn"
    >
      {customIconUrl ? (
        <img
          src={customIconUrl}
          alt={item.label}
          style={{
            width: '19px',
            height: '19px',
            objectFit: 'contain',
            filter: highlight ? 'brightness(0) invert(1)' : isActive ? 'none' : 'grayscale(1) opacity(0.8)',
          }}
        />
      ) : (
        Icon && <Icon size={19} />
      )}

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

      <div style={{
        position: 'absolute',
        left: 'calc(100% + 12px)',
        top: '50%',
        transform: 'translateY(-50%)',
        background: 'var(--ln-tooltip-bg)',
        backdropFilter: 'blur(12px)',
        border: '1px solid var(--ln-tooltip-border)',
        color: 'var(--ln-tooltip-color)',
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

  const {
    workspaces,
    activeWorkspace,
    setActiveWorkspace,
    fetchWorkspaces,
  } = useWorkspaceStore();

  const [modalOpen, setModalOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [workspaceContextMenu, setWorkspaceContextMenu] = useState(null);

  useEffect(() => {
    if (user) {
      fetchWorkspaces();
    }
  }, [user, fetchWorkspaces]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleTogglePinWorkspace = async (e, ws) => {
    e.stopPropagation();
    const isPinned = user?.pinnedWorkspaces?.includes(ws._id);
    const endpoint = isPinned ? `/user/unpin-workspace/${ws._id}` : `/user/pin-workspace/${ws._id}`;
    try {
      const { data } = await axiosInstance.put(endpoint);
      useAuthStore.getState().updateUser({ pinnedWorkspaces: data.pinnedWorkspaces });
      toast.success(isPinned ? 'Workspace unpinned' : 'Workspace pinned');
    } catch (err) {
      toast.error('Failed to update workspace settings.');
    }
    setWorkspaceContextMenu(null);
  };

  const handleToggleMuteWorkspace = async (e, ws) => {
    e.stopPropagation();
    const isMuted = user?.mutedWorkspaces?.includes(ws._id);
    const endpoint = isMuted ? `/user/unmute-workspace/${ws._id}` : `/user/mute-workspace/${ws._id}`;
    try {
      const { data } = await axiosInstance.put(endpoint);
      useAuthStore.getState().updateUser({ mutedWorkspaces: data.mutedWorkspaces });
      toast.success(isMuted ? 'Workspace unmuted' : 'Workspace muted');
    } catch (err) {
      toast.error('Failed to update workspace settings.');
    }
    setWorkspaceContextMenu(null);
  };

  const handleDeleteWorkspace = async (e, ws) => {
    e.stopPropagation();
    const confirmText = ws.owner === user?._id
      ? 'Delete workspace? This will erase all channels and messages.'
      : 'Leave workspace?';
    if (!window.confirm(confirmText)) return;
    try {
      const { deleteWorkspace } = useWorkspaceStore.getState();
      await deleteWorkspace(ws._id);
      toast.success(ws.owner === user?._id ? 'Workspace deleted' : 'Left workspace');
    } catch (err) {
      toast.error('Failed to delete/leave workspace.');
    }
    setWorkspaceContextMenu(null);
  };

  const navItems = [
    { key: 'chats', icon: MessageSquare, path: '/', label: 'Chats' },
    { key: 'workspaces', icon: Building2, label: 'Workspaces', onClick: () => setDropdownOpen(!dropdownOpen) },
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

  const sortedWorkspaces = [...workspaces].sort((a, b) => {
    const aPinned = user?.pinnedWorkspaces?.includes(a._id) ? 1 : 0;
    const bPinned = user?.pinnedWorkspaces?.includes(b._id) ? 1 : 0;
    if (aPinned !== bPinned) {
      return bPinned - aPinned;
    }
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  return (
    <>
      <style>{`
        :root {
          --ln-bg: rgba(11, 11, 19, 0.82);
          --ln-border: rgba(255, 255, 255, 0.06);
          --ln-btn-color: rgba(255, 255, 255, 0.35);
          --ln-btn-hover-bg: rgba(255, 255, 255, 0.05);
          --ln-btn-hover-color: rgba(255, 255, 255, 0.7);
          --ln-btn-hover-border: rgba(255, 255, 255, 0.1);
          --ln-tooltip-bg: rgba(15, 15, 22, 0.95);
          --ln-tooltip-border: rgba(255, 255, 255, 0.1);
          --ln-tooltip-color: rgba(255, 255, 255, 0.85);
          --ln-avatar-border: rgba(255, 255, 255, 0.1);
        }
        :root.light {
          --ln-bg: rgba(255, 255, 255, 0.82);
          --ln-border: rgba(0, 0, 0, 0.06);
          --ln-btn-color: rgba(30, 27, 58, 0.4);
          --ln-btn-hover-bg: rgba(0, 0, 0, 0.04);
          --ln-btn-hover-color: rgba(30, 27, 58, 0.75);
          --ln-btn-hover-border: rgba(0, 0, 0, 0.08);
          --ln-tooltip-bg: rgba(255, 255, 255, 0.95);
          --ln-tooltip-border: rgba(0, 0, 0, 0.08);
          --ln-tooltip-color: rgba(30, 27, 58, 0.85);
          --ln-avatar-border: rgba(0, 0, 0, 0.08);
        }
        .ln-nav-btn:hover {
          background: var(--ln-btn-hover-bg) !important;
          color: var(--ln-btn-hover-color) !important;
          border-color: var(--ln-btn-hover-border) !important;
          transform: translateY(-1px);
        }
        .ln-nav-btn:hover .ln-tooltip {
          opacity: 1 !important;
        }
        .ln-nav-btn:active {
          transform: scale(0.93) !important;
        }
        .ln-avatar-wrap:hover {
          border-color: var(--accent) !important;
          transform: translateY(-1px);
          box-shadow: 0 4px 16px var(--accent-glow) !important;
        }
        .ln-logout-btn:hover {
          color: #f87171 !important;
          background: rgba(248,113,113,0.08) !important;
        }
        .ln-mob-btn:hover { color: var(--ln-btn-hover-color) !important; }
        
        .ws-item {
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .ws-item.active {
          border-radius: 12px;
          background: var(--accent);
          color: white;
        }
        .ws-item:not(.active):hover {
          border-radius: 12px;
          background: var(--ln-btn-hover-bg);
          color: white;
        }
        .ws-list-item:hover {
          border-color: var(--accent-border) !important;
          background: var(--ln-btn-hover-bg) !important;
        }
      `}</style>

      <div style={{
        display: 'none',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px 0',
        width: '72px',
        height: '100%',
        background: 'var(--ln-bg)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRight: '1px solid var(--ln-border)',
        flexShrink: 0,
        userSelect: 'none',
        position: 'relative',
        zIndex: 30,
      }} className="ln-desktop">

        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'linear-gradient(180deg, rgba(123,110,246,0.04) 0%, transparent 40%, rgba(123,110,246,0.03) 100%)',
          pointerEvents: 'none',
        }} />

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', width: '100%' }}>
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

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', width: '100%', padding: '0 12px', position: 'relative', zIndex: 1 }}>
            {navItems.map((item) => {
              const isActive = item.key === 'workspaces' ? dropdownOpen : item.path ? location.pathname === item.path : false;
              const CustomIconUrl = config?.sidebarIcons?.[item.key];
              const customItem = CustomIconUrl ? { ...item, customIconUrl: CustomIconUrl } : item;

              return (
                <NavButton
                  key={item.key}
                  item={customItem}
                  isActive={isActive}
                  onClick={() => (item.onClick ? item.onClick() : navigate(item.path))}
                />
              );
            })}
          </div>
        </div>

        {location.pathname === '/' && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
            flex: 1,
            overflowY: 'auto',
            padding: '10px 0',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            gap: '8px',
          }} className="no-scrollbar">
            <div style={{ width: '32px', height: '1px', background: 'var(--ln-border)', margin: '4px 0' }} />

            <button
              onClick={() => setActiveWorkspace(null)}
              title="Direct Messages"
              style={{
                width: '42px',
                height: '42px',
                borderRadius: activeWorkspace === null ? '12px' : '20px',
                background: activeWorkspace === null ? 'var(--accent-glow)' : 'var(--bg-panel)',
                border: activeWorkspace === null ? '1.5px solid var(--accent-border)' : '1px solid var(--border-primary)',
                color: activeWorkspace === null ? 'var(--accent)' : 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                outline: 'none',
              }}
              className="ws-item active:scale-95"
            >
              <Home size={16} />
            </button>

            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              title="Workspaces list"
              style={{
                width: '42px',
                height: '42px',
                borderRadius: activeWorkspace !== null ? '12px' : '20px',
                background: activeWorkspace !== null ? 'var(--accent-glow)' : 'var(--bg-panel)',
                border: activeWorkspace !== null ? '1.5px solid var(--accent-border)' : '1px solid var(--border-primary)',
                color: activeWorkspace !== null ? 'var(--accent)' : 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                outline: 'none',
              }}
              className="ws-item active:scale-95 text-xs font-mono font-bold"
            >
              {activeWorkspace ? activeWorkspace.name?.slice(0, 2).toUpperCase() : <Building2 size={16} />}
            </button>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', position: 'relative', zIndex: 1 }}>
          <div
            onClick={() => navigate('/profile')}
            className="ln-avatar-wrap"
            style={{
              width: '36px', height: '36px', borderRadius: '11px',
              overflow: 'hidden',
              border: '1.5px solid var(--ln-avatar-border)',
              cursor: 'pointer',
              transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            }}
          >
            <img src={getAvatar()} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>

          <button
            onClick={handleLogout}
            title="Logout"
            className="ln-logout-btn"
            style={{
              width: '36px', height: '36px', borderRadius: '11px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid transparent',
              background: 'transparent',
              color: 'var(--ln-btn-color)',
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontFamily: 'inherit',
            }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div >

      {
        showMobileBottomBar && (
          <div style={{
            position: 'fixed',
            bottom: 0, left: 0, right: 0,
            height: '64px',
            background: 'var(--ln-bg)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            borderTop: '1px solid var(--ln-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
            padding: '0 8px',
            zIndex: 40,
            userSelect: 'none',
          }} className="ln-mobile">
            {navItems.map((item) => {
              const isActive = item.key === 'workspaces' ? dropdownOpen : item.path ? location.pathname === item.path : false;
              const CustomIconUrl = config?.sidebarIcons?.[item.key];
              const Icon = item.icon;

              return (
                <button
                  key={item.key}
                  onClick={() => (item.onClick ? item.onClick() : navigate(item.path))}
                  className="ln-mob-btn"
                  style={{
                    position: 'relative',
                    width: '48px', height: '48px',
                    borderRadius: '14px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: isActive ? 'var(--accent-glow)' : 'transparent',
                    border: isActive ? '1px solid var(--accent-border)' : '1px solid transparent',
                    color: isActive ? 'var(--accent)' : 'var(--ln-btn-color)',
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
        )
      }

      {dropdownOpen && (
        <>
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 998,
              background: 'transparent',
            }}
            onClick={() => setDropdownOpen(false)}
          />
          <div
            style={{
              position: 'fixed',
              left: '80px',
              bottom: '80px',
              width: '260px',
              background: 'rgba(15, 15, 22, 0.95)',
              backdropFilter: 'blur(16px)',
              border: '1px solid var(--border-primary)',
              borderRadius: '16px',
              padding: '16px',
              boxShadow: '0 15px 40px rgba(0,0,0,0.6)',
              zIndex: 999,
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
            className="ws-popover fade-in-quick"
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '1px' }}>
                WORKSPACES
              </span>
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  setModalOpen(true);
                }}
                title="Create Workspace"
                style={{
                  background: 'var(--accent-glow)',
                  border: '1.5px solid var(--accent-border)',
                  borderRadius: '10px',
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent)',
                  cursor: 'pointer',
                }}
                className="hover:scale-105 active:scale-95 transition"
              >
                <Plus size={14} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '250px', overflowY: 'auto' }} className="no-scrollbar">
              <div
                onClick={() => {
                  setActiveWorkspace(null);
                  setDropdownOpen(false);
                  navigate('/');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  background: activeWorkspace === null ? 'var(--accent-glow)' : 'var(--bg-panel)',
                  border: activeWorkspace === null ? '1px solid var(--accent-border)' : '1px solid var(--border-primary)',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
                className="ws-list-item hover:border-indigo-500/50"
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: activeWorkspace === null ? 'var(--accent)' : 'rgba(255,255,255,0.06)',
                    color: activeWorkspace === null ? '#ffffff' : 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Home size={14} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '12px', fontWeight: activeWorkspace === null ? 800 : 700, color: 'var(--text-primary)' }}>
                    Direct Messages
                  </span>
                  <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
                    Home space
                  </span>
                </div>
              </div>

              {sortedWorkspaces.map((ws) => {
                const isActive = activeWorkspace?._id === ws._id;
                const isPinned = user?.pinnedWorkspaces?.includes(ws._id);
                const isMuted = user?.mutedWorkspaces?.includes(ws._id);
                const initials = ws.name ? ws.name.slice(0, 2).toUpperCase() : 'WS';

                return (
                  <div
                    key={ws._id}
                    onClick={() => {
                      setActiveWorkspace(ws);
                      setDropdownOpen(false);
                      navigate('/');
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setWorkspaceContextMenu({
                        x: e.clientX,
                        y: e.clientY,
                        workspace: ws,
                      });
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: '10px',
                      background: isActive ? 'var(--accent-glow)' : 'var(--bg-panel)',
                      border: isActive ? '1px solid var(--accent-border)' : '1px solid var(--border-primary)',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                    className="ws-list-item hover:border-indigo-500/50"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: isActive ? 'var(--accent)' : 'rgba(255,255,255,0.06)',
                          color: isActive ? '#ffffff' : 'var(--text-secondary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '10px',
                          fontWeight: 800,
                        }}
                      >
                        {initials}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '12px', fontWeight: isActive ? 800 : 700, color: 'var(--text-primary)', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {ws.name}
                        </span>
                        <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
                          {ws.members?.length || 1} member{(ws.members?.length || 1) !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {isPinned && <BsPinAngleFill size={10} style={{ color: 'var(--accent)' }} />}
                      {isMuted && <BsVolumeMuteFill size={11} style={{ color: 'var(--text-muted)' }} />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {workspaceContextMenu && (
        <>
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9998,
              background: 'transparent',
            }}
            onClick={() => setWorkspaceContextMenu(null)}
            onContextMenu={(e) => {
              e.preventDefault();
              setWorkspaceContextMenu(null);
            }}
          />
          <div
            style={{
              position: 'fixed',
              top: `${workspaceContextMenu.y}px`,
              left: `${workspaceContextMenu.x}px`,
              zIndex: 9999,
              minWidth: '160px',
              background: 'rgba(15, 15, 22, 0.95)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              padding: '6px',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.6)',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
            }}
            className="fade-in-quick"
          >
            <button
              onClick={(e) => handleTogglePinWorkspace(e, workspaceContextMenu.workspace)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                width: '100%',
                padding: '8px 12px',
                fontSize: '11px',
                color: 'var(--text-secondary)',
                background: 'transparent',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                textAlign: 'left',
              }}
              className="hover:bg-white/5 hover:text-white"
            >
              <BsPinAngleFill size={11} style={{ color: 'var(--accent)' }} />
              <span>{user?.pinnedWorkspaces?.includes(workspaceContextMenu.workspace._id) ? 'Unpin Workspace' : 'Pin Workspace'}</span>
            </button>
            <button
              onClick={(e) => handleToggleMuteWorkspace(e, workspaceContextMenu.workspace)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                width: '100%',
                padding: '8px 12px',
                fontSize: '11px',
                color: 'var(--text-secondary)',
                background: 'transparent',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                textAlign: 'left',
              }}
              className="hover:bg-white/5 hover:text-white"
            >
              <BsVolumeMuteFill size={12} style={{ color: 'var(--text-muted)' }} />
              <span>{user?.mutedWorkspaces?.includes(workspaceContextMenu.workspace._id) ? 'Unmute Workspace' : 'Mute Workspace'}</span>
            </button>
            <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '4px 0' }} />
            <button
              onClick={(e) => handleDeleteWorkspace(e, workspaceContextMenu.workspace)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                width: '100%',
                padding: '8px 12px',
                fontSize: '11px',
                color: '#ef4444',
                background: 'transparent',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                textAlign: 'left',
              }}
              className="hover:bg-red-500/10 hover:text-red-400"
            >
              {workspaceContextMenu.workspace.owner === user?._id ? (
                <BsTrash3Fill size={11} />
              ) : (
                <BsBoxArrowRight size={12} />
              )}
              <span>{workspaceContextMenu.workspace.owner === user?._id ? 'Delete Workspace' : 'Leave Workspace'}</span>
            </button>
          </div>
        </>
      )}

      <WorkspaceModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => navigate('/')}
      />

      <style>{`
        @media (min-width: 768px) {
          .ln-desktop { display: flex !important; }
          .ln-mobile  { display: none !important; }
        }
        @media (max-width: 767px) {
          .ln-desktop { display: none !important; }
          .ws-popover {
            left: 50% !important;
            bottom: 80px !important;
            transform: translateX(-50%) !important;
            width: 90% !important;
            max-width: 320px !important;
          }
        }
      `}</style>
    </>
  );
};

export default LeftNavbar;
