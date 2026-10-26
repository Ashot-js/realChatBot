import { useChat } from '../context/ChatContext';
import { useVisibleHeight } from '../hooks/useVisibleHeight';
import Sidebar from './Sidebar';
import ChatWindow from './ChatWindow';

/**
 * Phones: the chat list and an open chat each take the whole screen.
 * Tablets and up (md): list on the left, conversation on the right.
 */
export default function ChatLayout() {
  const { activeChat } = useChat();
  const height = useVisibleHeight();

  return (
    <div className="flex h-dvh overflow-hidden" style={height ? { height } : undefined}>
      <Sidebar className={activeChat ? 'hidden md:flex' : 'flex'} />
      {activeChat ? (
        <ChatWindow key={activeChat._id} chat={activeChat} />
      ) : (
        <section className="hidden flex-1 flex-col items-center justify-center p-6 text-center md:flex">
          <div className="mb-4 text-6xl">💬</div>
          <h2 className="mb-2 text-xl font-semibold">Select a conversation</h2>
          <p className="max-w-xs text-sm text-slate-400">Choose a chat on the left or search for someone to start talking.</p>
        </section>
      )}
    </div>
  );
}
