interface Props {
  url: string;
  type: string;
  fileName?: string;
}

export default function FilePreview({ url, type, fileName }: Props) {
  if (type === 'image') {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer">
        <img
          src={url}
          alt={fileName || 'Image'}
          className="file-preview-img"
          loading="lazy"
        />
      </a>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 px-3 py-2 bg-navy-700 rounded-lg text-sm text-blue-400 hover:text-blue-300 transition-colors"
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
