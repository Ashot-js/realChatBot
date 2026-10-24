import { useEffect, useState } from 'react';
import { useChatContext } from '../context/ChatContext';
import Sidebar from './Sidebar';
import ChatWindow from './ChatWindow';

export default function ChatLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { activeChat } = useChatContext();

  // Close the mobile sidebar when a conversation is opened.
  useEffect(() => {
    if (activeChat) setSidebarOpen(false);
  }, [activeChat?._id]);

  return (
    <div className="chat-shell">
      <div className="chat-orb chat-orb--1" aria-hidden="true" />
      <div className="chat-orb chat-orb--2" aria-hidden="true" />
      <div className="chat-orb chat-orb--3" aria-hidden="true" />

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <ChatWindow onOpenSidebar={() => setSidebarOpen(true)} />
    </div>
  );
}
