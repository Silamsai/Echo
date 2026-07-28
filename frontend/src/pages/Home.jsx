import { useState, useRef, useCallback, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import ChatWindow from '../components/ChatWindow';
import ChatIllustration from '../components/ChatIllustration';
import useChatStore from '../store/chatStore';
import useWorkspaceStore from '../store/workspaceStore';
import useSocket from '../hooks/useSocket';

const MIN_W = 200;
const MAX_W = 450;

const Home = () => {
  const [activeConversation, setActiveConversation] = useState(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem('sidebarWidth');
    return saved ? parseInt(saved, 10) : 260;
  });
  const [isResizing, setIsResizing] = useState(false);

  const containerRef = useRef(null);
  const dragStartX = useRef(0);
  const dragStartW = useRef(0);

  const { setActiveConversation: storeSetActive } = useChatStore();
  const { activeWorkspace } = useWorkspaceStore();

  useSocket();

  const handleSelectConversation = (conv) => {
    setActiveConversation(conv);
    storeSetActive(conv);
    setMobileSidebarOpen(false);
  };

  const handleBackToSidebar = () => {
    setMobileSidebarOpen(true);
  };

  /* ── Drag logic ── */
  const onMouseDown = useCallback((e) => {
    e.preventDefault();
    dragStartX.current = e.clientX;
    dragStartW.current = sidebarWidth;
    setIsResizing(true);
  }, [sidebarWidth]);

  const onMouseMove = useCallback((e) => {
    if (!isResizing) return;
    const delta = e.clientX - dragStartX.current;
    const newW = Math.min(MAX_W, Math.max(MIN_W, dragStartW.current + delta));
    setSidebarWidth(newW);
  }, [isResizing]);

  const onMouseUp = useCallback(() => {
    if (!isResizing) return;
    setIsResizing(false);
    localStorage.setItem('sidebarWidth', sidebarWidth);
  }, [isResizing, sidebarWidth]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isResizing, onMouseMove, onMouseUp]);

  return (
    <div ref={containerRef} className="flex h-full overflow-hidden relative">

      {/* ── SIDEBAR ──
          Desktop: fixed width set by drag state
          Mobile: full-screen overlay toggled by mobileSidebarOpen
      */}
      <div
        className={`
          flex-shrink-0 h-full z-20
          md:relative md:flex
          absolute inset-0
          transition-transform duration-300 ease-in-out
          ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
        style={{ width: window.innerWidth >= 768 ? sidebarWidth : undefined }}
      >
        <Sidebar
          onSelectConversation={handleSelectConversation}
          activeConversation={activeConversation}
        />
      </div>

      {/* ── RESIZE HANDLE (desktop only) ── */}
      <div
        className={`hidden md:flex resize-handle ${isResizing ? 'active' : ''}`}
        onMouseDown={onMouseDown}
        title="Drag to resize"
      />

      {/* ── MAIN CONTENT AREA ── */}
      <div
        className={`
          flex-1 flex overflow-hidden h-full
          transition-all duration-300
          ${mobileSidebarOpen ? 'md:flex hidden' : 'flex'}
          md:flex
        `}
      >
        {activeConversation ? (
          <div className="flex-1 flex flex-col overflow-hidden w-full">
            <ChatWindow
              conversation={activeConversation}
              onBack={handleBackToSidebar}
            />
          </div>
        ) : (
          <div className="flex-1 hidden md:flex overflow-hidden">
            <ChatIllustration
              modeLabel={activeWorkspace ? `Workspace: ${activeWorkspace.name}` : 'Direct Messages'}
              helperText={activeWorkspace
                ? 'Pick a channel on the left or create a new one from the sidebar.'
                : 'Select an existing chat, search for people, or start a new group from the sidebar.'}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
