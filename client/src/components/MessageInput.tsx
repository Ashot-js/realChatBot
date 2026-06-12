import { useState, useRef, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { useChatContext } from '../context/ChatContext';
import { uploadApi } from '../services/api';
import EmojiPicker from './EmojiPicker';

export default function MessageInput() {
  const { socket } = useSocket();
  const { activeChat } = useChatContext();
  const [text, setText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout>>();

  // Emit typing events
  function emitTyping(isTyping: boolean) {
    if (!activeChat || !socket) return;
    socket.emit(isTyping ? 'typing:start' : 'typing:stop', {
      chatId: activeChat._id,
    });
  }

  function handleTextChange(value: string) {
    setText(value);

    if (value && !typingTimeout.current) {
      emitTyping(true);
    }

    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      emitTyping(false);
      typingTimeout.current = undefined;
    }, 1000);
  }

  // Stop typing on unmount
  useEffect(() => {
    return () => {
      if (typingTimeout.current) {
        emitTyping(false);
      }
    };
  }, []);

  function sendMessage(e?: React.FormEvent) {
    e?.preventDefault();
    if (!text.trim() || !activeChat || !socket) {
      console.warn('[MessageInput] Cannot send:', { text: !!text.trim(), activeChat: !!activeChat, socket: !!socket });
      return;
    }

    console.log('[MessageInput] Sending message:', { chatId: activeChat._id, content: text.trim() });
    socket.emit('message:send', {
      chatId: activeChat._id,
      content: text.trim(),
      type: 'text',
    });

    setText('');
    emitTyping(false);
    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
      typingTimeout.current = undefined;
    }
    inputRef.current?.focus();
  }

  function handleEmojiSelect(emoji: string) {
    setText((prev) => prev + emoji);
    setShowEmoji(false);
    inputRef.current?.focus();
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !activeChat || !socket) return;

    setUploading(true);
    try {
      const { data } = await uploadApi.upload(file);

      const type = file.type.startsWith('image/') ? 'image' : 'file';
      socket.emit('message:send', {
        chatId: activeChat._id,
        content: '',
        type,
        fileUrl: data.url,
        fileName: data.fileName,
        fileSize: data.fileSize,
      });
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  if (!activeChat) return null;

  return (
    <form
      onSubmit={sendMessage}
      className="p-3 border-t border-navy-700 bg-navy-800 flex items-end gap-2"
    >
      {/* Emoji button */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowEmoji(!showEmoji)}
          className="text-slate-400 hover:text-yellow-400 transition-colors p-1"
        >
          😊
        </button>
        {showEmoji && (
          <div className="absolute bottom-full left-0 mb-2">
            <EmojiPicker onSelect={handleEmojiSelect} onClose={() => setShowEmoji(false)} />
          </div>
        )}
      </div>

      {/* File upload */}
      <label className="text-slate-400 hover:text-blue-400 transition-colors p-1 cursor-pointer">
        {uploading ? (
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
            />
          </svg>
        )}
        <input
          type="file"
          onChange={handleFileUpload}
          className="hidden"
          accept="*/*"
        />
      </label>

      {/* Text input */}
      <input
        ref={inputRef}
        type="text"
        value={text}
        onChange={(e) => handleTextChange(e.target.value)}
        placeholder="Type a message..."
        className="chat-input flex-1"
      />

      {/* Send button */}
      <button
        type="submit"
        disabled={!text.trim()}
        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white p-2 rounded-lg transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
          />
        </svg>
      </button>
    </form>
  );
}
