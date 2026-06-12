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
      <div className="flex justify-center">
        <span className="text-xs text-slate-500 bg-navy-800 px-3 py-1 rounded-full">
          {message.content}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
      {!isMine && (
        <div className="w-8 h-8 rounded-full bg-navy-600 flex items-center justify-center text-xs font-medium mr-2 shrink-0 mt-1">
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
        {message.fileUrl && (
          <FilePreview
            url={message.fileUrl}
            type={message.type}
            fileName={message.fileName}
          />
        )}

        {/* Text */}
        {message.content && (
          <div
            className={`px-3 py-2 text-sm ${
              isMine ? 'message-bubble-mine' : 'message-bubble-other'
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
