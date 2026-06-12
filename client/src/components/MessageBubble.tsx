import { useAuth } from '../context/AuthContext';
import { Message } from '../types';
import FilePreview from './FilePreview';

interface Props {
  message: Message;
}

export default function MessageBubble({ message }: Props) {
  const { user } = useAuth();
  const isMine = message.sender._id === user?._id;

  function formatTime(date: string): string {
    return new Date(date).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  if (message.type === 'system') {
    return (
      <div className="flex justify-center animate-slide-up">
        <span className="text-xs text-slate-500 bg-surface-light px-3 py-1 rounded-full border border-surface-lighter">
          {message.content}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} animate-slide-up`}>
      {!isMine && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-xs font-bold text-white mr-2 shrink-0 mt-1 shadow-md">
          {message.sender.username[0].toUpperCase()}
        </div>
      )}

      <div className={`max-w-[70%] ${isMine ? 'items-end' : 'items-start'}`}>
        {!isMine && (
          <p className="text-xs text-slate-400 mb-0.5 ml-1">
            {message.sender.username}
          </p>
        )}

        {/* File */}
        {message.fileUrl && message.type !== 'audio' && (
          <FilePreview
            url={message.fileUrl}
            type={message.type}
            fileName={message.fileName}
          />
        )}

        {/* Audio */}
        {message.type === 'audio' && message.fileUrl && (
          <AudioPlayer url={message.fileUrl} isMine={isMine} />
        )}

        {/* Text */}
        {message.content && (
          <div
            className={`px-3 py-2 text-sm leading-relaxed ${
              isMine ? 'message-bubble-mine text-white' : 'message-bubble-other text-slate-200'
            }`}
          >
            {message.content}
          </div>
        )}

        <p
          className={`text-xs text-slate-500 mt-0.5 ${
            isMine ? 'text-right mr-1' : 'text-left ml-1'
          }`}
        >
          {formatTime(message.createdAt)}
        </p>
      </div>
    </div>
  );
}

/* ─── Inline Audio Player ─────────────────────────────── */
function AudioPlayer({ url, isMine }: { url: string; isMine: boolean }) {
  return (
    <div
      className={`flex items-center gap-3 px-3 py-2.5 mb-1 ${
        isMine
          ? 'bg-gradient-to-r from-violet-600 to-violet-700 rounded-2xl rounded-br-md shadow-lg shadow-violet-500/25'
          : 'bg-surface-light border border-surface-lighter rounded-2xl rounded-bl-md'
      }`}
    >
      <audio src={url} preload="metadata" className="hidden" id={`audio-${url}`} />

      {/* Play/Pause */}
      <button
        onClick={() => {
          const audio = document.getElementById(`audio-${url}`) as HTMLAudioElement;
          if (audio) {
            audio.paused ? audio.play() : audio.pause();
          }
        }}
        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all ${
          isMine
            ? 'bg-white/20 hover:bg-white/30 text-white'
            : 'bg-violet-500/20 hover:bg-violet-500/30 text-violet-400'
        }`}
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z" />
        </svg>
      </button>

      {/* Waveform bars */}
      <div className="audio-wave paused flex-1">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="audio-wave-bar"
            style={{
              height: `${6 + Math.sin(i * 0.8) * 8}px`,
              background: isMine ? 'rgba(255,255,255,0.7)' : '#a78bfa',
            }}
          />
        ))}
      </div>

      {/* Duration */}
      <span className={`text-xs shrink-0 ${isMine ? 'text-white/70' : 'text-slate-400'}`}>
        0:00
      </span>
    </div>
  );
}
