import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import ChatWindow from '../components/ChatWindow';
import ChatIllustration from '../components/ChatIllustration';
import useChatStore from '../store/chatStore';
import useSocket from '../hooks/useSocket';

const Home = () => {
  const [activeConversation, setActiveConversation] = useState(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(true);
  const { setActiveConversation: storeSetActive } = useChatStore();

  // Register all socket listeners globally
  useSocket();

  const handleSelectConversation = (conv) => {
    setActiveConversation(conv);
    storeSetActive(conv);
    // On mobile: close sidebar and show chat
    setMobileSidebarOpen(false);
  };

  const handleBackToSidebar = () => {
    setMobileSidebarOpen(true);
  };

  return (
    <div className="flex h-full overflow-hidden relative">
      {/* ── SIDEBAR ──
          Desktop: always visible (w-auto)
          Mobile: full-screen overlay, toggled by mobileSidebarOpen
      */}
      <div
        className={`
          flex-shrink-0 h-full z-20
          md:relative md:flex md:w-auto
          absolute inset-0
          transition-transform duration-300 ease-in-out
          ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <Sidebar
          onSelectConversation={handleSelectConversation}
          activeConversation={activeConversation}
        />
      </div>

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
          /* Empty state — desktop only (mobile always shows sidebar first) */
          <div className="flex-1 hidden md:flex overflow-hidden">
            <ChatIllustration />
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
