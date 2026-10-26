import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useSocket } from '../context/SocketContext';
import { uploadFile } from '../services/api';
import type { MessageType } from '../types';
import EmojiPicker from './EmojiPicker';
import VoiceRecorder from './VoiceRecorder';
import Spinner from './Spinner';

const iconButton = 'flex size-10 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-white/5';
const ACCEPT = 'image/png,image/jpeg,image/gif,image/webp,audio/*,application/pdf,text/plain,application/zip';
const TYPING_IDLE_MS = 1500;

export default function MessageInput({ chatId }: { chatId: string }) {
  const socket = useSocket();
  const [text, setText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Server-side rejections (e.g. invalid message) arrive as socket "error" events.
  useEffect(() => {
    if (!socket) return;
    const onError = ({ message }: { message: string }) => setError(message);
    socket.on('error', onError);
    return () => {
      socket.off('error', onError);
    };
  }, [socket]);

  const stopTyping = () => {
    if (!typingTimer.current) return;
    clearTimeout(typingTimer.current);
    typingTimer.current = null;
    socket?.emit('typing:stop', { chatId });
  };

  // Tell the others we stopped typing when leaving the chat.
  useEffect(() => () => stopTyping(), []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleChange(value: string) {
    setText(value);
    setError('');
    if (!typingTimer.current) socket?.emit('typing:start', { chatId });
    else clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(stopTyping, TYPING_IDLE_MS);
  }

  function send(payload: { content?: string; type: MessageType; fileUrl?: string; fileName?: string; fileSize?: number }) {
    if (!socket?.connected) {
      setError('Not connected — reconnecting, please try again in a moment');
      return false;
    }
    socket.emit('message:send', { chatId, content: '', ...payload });
    return true;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const content = text.trim();
    if (!content) return;
    if (send({ content, type: 'text' })) {
      setText('');
      stopTyping();
    }
    inputRef.current?.focus();
  }

  async function sendFile(file: File, type?: MessageType) {
    setUploading(true);
    setError('');
    try {
      const up = await uploadFile(file);
      send({
        type: type ?? (up.mimetype.startsWith('image/') ? 'image' : up.mimetype.startsWith('audio/') ? 'audio' : 'file'),
        fileUrl: up.url,
        fileName: type === 'audio' ? 'Voice message' : up.fileName,
        fileSize: up.fileSize,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="shrink-0 border-t border-line bg-ink-900/80 px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-xl sm:px-4">
      {error && (
        <p role="alert" className="mb-2 px-2 text-xs text-red-400">
          {error}
        </p>
      )}
      <form onSubmit={handleSubmit} className="flex items-center gap-1">
        {!recording && (
          <>
            <div className="relative">
              <button type="button" onClick={() => setShowEmoji(!showEmoji)} className={`${iconButton} text-lg`} aria-label="Emoji">
                😊
              </button>
              {showEmoji && (
                <div className="absolute bottom-full left-0 z-20 mb-2">
                  <EmojiPicker
                    onSelect={(emoji) => {
                      setText((t) => t + emoji);
                      setShowEmoji(false);
                      inputRef.current?.focus();
                    }}
                    onClose={() => setShowEmoji(false)}
                  />
                </div>
              )}
            </div>

            <label className={`${iconButton} cursor-pointer hover:text-violet-300`} aria-label="Attach file" title="Attach a file (up to 5 MB)">
              {uploading ? (
                <Spinner className="size-4" />
              ) : (
                <svg className="size-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
              )}
              <input
                type="file"
                accept={ACCEPT}
                disabled={uploading}
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = '';
                  if (file) sendFile(file);
                }}
              />
            </label>
          </>
        )}

        <VoiceRecorder onSend={(file) => sendFile(file, 'audio')} onError={setError} onRecordingChange={setRecording} />

        {!recording && (
          <>
            <input
              ref={inputRef}
              value={text}
              onChange={(e) => handleChange(e.target.value)}
              maxLength={4000}
              placeholder="Message…"
              aria-label="Message"
              enterKeyHint="send"
              className="min-w-0 flex-1 rounded-xl border border-line bg-ink-950 px-3.5 py-2 text-base text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
            />
            <button
              type="submit"
              disabled={!text.trim()}
              aria-label="Send"
              className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-violet-700 text-white shadow-lg shadow-violet-600/20 transition hover:brightness-110 disabled:opacity-30"
            >
              <svg className="size-5" fill="currentColor" viewBox="0 0 24 24"><path d="M3.4 20.4l17.45-7.48a1 1 0 000-1.84L3.4 3.6a1 1 0 00-1.39.92L2 9.12c0 .5.37.93.87.99L17 12 2.87 13.88c-.5.07-.87.5-.87 1l.01 4.6a1 1 0 001.39.92z" /></svg>
            </button>
          </>
        )}
      </form>
    </div>
  );
}
