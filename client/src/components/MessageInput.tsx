import { useState, useRef, useEffect, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';
import { useChatContext } from '../context/ChatContext';
import { uploadApi } from '../services/api';
import EmojiPicker from './EmojiPicker';
import VoiceRecorder from './VoiceRecorder';

export default function MessageInput() {
  const { socket } = useSocket();
  const { activeChat } = useChatContext();
  const [text, setText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout>>();

  // Emit typing events
  const emitTyping = useCallback(
    (isTyping: boolean) => {
      if (!activeChat || !socket) return;
      socket.emit(isTyping ? 'typing:start' : 'typing:stop', {
        chatId: activeChat._id,
      });
    },
    [activeChat, socket]
  );

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
  }, [emitTyping]);

  function sendMessage(e?: React.FormEvent) {
    e?.preventDefault();
    if (!text.trim() || !activeChat || !socket) {
      console.warn('[MessageInput] Cannot send:', { text: !!text.trim(), activeChat: !!activeChat, socket: !!socket });
      return;
    }

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

  function handleVoiceSend(audioBlob: Blob) {
    if (!activeChat || !socket) return;

    // Convert blob to file and upload
    const file = new File([audioBlob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });
    setUploading(true);
    uploadApi
      .upload(file)
      .then(({ data }) => {
        socket.emit('message:send', {
          chatId: activeChat._id,
          content: '',
          type: 'audio',
          fileUrl: data.url,
          fileName: 'Voice message',
          fileSize: data.fileSize,
        });
      })
      .catch((err) => console.error('Voice upload failed:', err))
      .finally(() => setUploading(false));
  }

  if (!activeChat) return null;

  return (
    <form
      onSubmit={sendMessage}
      className="p-3 border-t border-surface-lighter glass-strong flex items-end gap-1.5"
    >
      {/* Emoji button */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowEmoji(!showEmoji)}
          className="text-slate-400 hover:text-yellow-400 transition-colors p-1.5"
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
      <label className="text-slate-400 hover:text-violet-400 transition-colors p-1.5 cursor-pointer">
        {uploading ? (
          <div className="w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
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

      {/* Voice recorder */}
      <VoiceRecorder onSend={handleVoiceSend} />

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
        className="bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-500 hover:to-violet-600 disabled:opacity-30 disabled:cursor-not-allowed text-white p-2.5 rounded-xl transition-all shadow-lg shadow-violet-500/20"
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
