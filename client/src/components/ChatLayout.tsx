import Sidebar from './Sidebar';
import ChatWindow from './ChatWindow';

export default function ChatLayout() {
  return (
    <div className="chat-shell">
      <div className="chat-bg-grid" aria-hidden="true" />
      <div className="chat-orb chat-orb--1" aria-hidden="true" />
      <div className="chat-orb chat-orb--2" aria-hidden="true" />
      <div className="chat-orb chat-orb--3" aria-hidden="true" />
      <Sidebar />
      <ChatWindow />
    </div>
  );
}
