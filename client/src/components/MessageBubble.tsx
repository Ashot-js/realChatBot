import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { fileUrl } from '../services/api';
import { formatSize, formatTime } from '../utils/chat';
import type { Message } from '../types';
import Avatar from './Avatar';

// Only our own file paths or plain http(s) links are ever rendered as a link or media source.
const safeUrl = (url?: string) => (url && /^(\/api\/files\/|https?:\/\/)/.test(url) ? fileUrl(url) : null);

const unavailable = (what: string) => (
  <p className="rounded-2xl border border-line bg-surface-2 px-3 py-2 text-xs text-slate-400 italic">{what} unavailable</p>
);

function Attachment({ message }: { message: Message }) {
  const [broken, setBroken] = useState(false);
  const url = safeUrl(message.fileUrl);
  if (!url) return unavailable('Attachment');

  if (message.type === 'image') {
    // Files from before the move to database storage were lost when the old server restarted.
    if (broken) return unavailable('Image');
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="block">
        <img
          src={url}
          alt={message.fileName || 'Image'}
          loading="lazy"
          onError={() => setBroken(true)}
          className="max-h-72 w-auto max-w-full rounded-2xl object-cover"
        />
      </a>
    );
  }
  if (message.type === 'audio') {
    return <audio controls preload="none" src={url} className="h-10 w-60 max-w-full" />;
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex max-w-full items-center gap-2 rounded-2xl border border-line bg-surface-2 px-3 py-2 text-sm text-violet-300 hover:text-violet-200"
    >
      <span aria-hidden>📎</span>
      <span className="truncate">{message.fileName || 'File'}</span>
      {message.fileSize ? <span className="shrink-0 text-xs text-slate-500">{formatSize(message.fileSize)}</span> : null}
    </a>
  );
}

export default function MessageBubble({ message, showSender }: { message: Message; showSender: boolean }) {
  const { user } = useAuth();
  const mine = message.sender._id === user?._id;

  if (message.type === 'system') {
    return (
      <p className="mx-auto w-fit rounded-full border border-line bg-surface-2 px-3 py-1 text-xs text-slate-500">{message.content}</p>
    );
  }

  return (
    <div className={`flex animate-slide-up items-end gap-2 ${mine ? 'justify-end' : ''}`}>
      {!mine && <Avatar name={message.sender.username} src={message.sender.avatar} className="size-8 text-xs" />}
      <div className={`flex max-w-[80%] min-w-0 flex-col gap-1 sm:max-w-[70%] ${mine ? 'items-end' : 'items-start'}`}>
        {showSender && !mine && <span className="ml-1 text-xs text-slate-400">{message.sender.username}</span>}
        {message.type !== 'text' && <Attachment message={message} />}
        {message.content && (
          <p
            className={`max-w-full px-3.5 py-2 text-[15px] leading-relaxed break-words whitespace-pre-wrap ${
              mine
                ? 'rounded-2xl rounded-br-md bg-gradient-to-br from-violet-600 to-violet-700 text-white shadow-lg shadow-violet-600/20'
                : 'rounded-2xl rounded-bl-md border border-line bg-surface-2 text-slate-100'
            }`}
          >
            {message.content}
          </p>
        )}
        <time dateTime={message.createdAt} className="px-1 text-[11px] text-slate-500">
          {formatTime(message.createdAt)}
        </time>
      </div>
    </div>
  );
}
