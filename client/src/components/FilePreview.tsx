const BACKEND = import.meta.env.VITE_SOCKET_URL || '';

interface Props {
  url: string;
  type: string;
  fileName?: string;
}

export default function FilePreview({ url, type, fileName }: Props) {
  const fullUrl = url.startsWith('/') ? `${BACKEND}${url}` : url;
  if (type === 'image') {
    return (
      <a href={fullUrl} target="_blank" rel="noopener noreferrer">
        <img
          src={fullUrl}
          alt={fileName || 'Image'}
          className="file-preview-img"
          loading="lazy"
        />
      </a>
    );
  }

  if (type === 'audio') {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-violet-500/10 border border-violet-500/20 rounded-xl">
        <span className="text-lg">🎙️</span>
        <audio controls src={fullUrl} className="h-8 w-48" />
      </div>
    );
  }

  return (
    <a
      href={fullUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 px-3 py-2 bg-surface-light border border-surface-lighter rounded-xl text-sm text-violet-400 hover:text-violet-300 transition-colors"
    >
      <span>📎</span>
      <span className="truncate max-w-[200px]">{fileName || 'File'}</span>
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
        />
      </svg>
    </a>
  );
}
