import Sidebar from './Sidebar';
import ChatWindow from './ChatWindow';

export default function ChatLayout() {
  return (
    <div className="h-screen flex bg-navy-900">
      <Sidebar />
      <ChatWindow />
    </div>
  );
}
