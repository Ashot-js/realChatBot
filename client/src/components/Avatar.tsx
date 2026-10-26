import { fileUrl } from '../services/api';

interface Props {
  name: string;
  src?: string;
  /** Tailwind size + text classes, e.g. "size-10 text-sm". */
  className?: string;
  /** Shows a presence dot when set. */
  online?: boolean;
}

export default function Avatar({ name, src, className = 'size-10 text-sm', online }: Props) {
  return (
    <span className={`relative inline-flex shrink-0 ${className}`}>
      {src ? (
        <img src={fileUrl(src)} alt="" className="size-full rounded-full object-cover ring-2 ring-violet-500/30" />
      ) : (
        <span className="flex size-full items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 font-bold text-white uppercase shadow-md">
          {name.charAt(0) || '?'}
        </span>
      )}
      {online !== undefined && (
        <span
          title={online ? 'Online' : 'Offline'}
          className={`absolute right-0 bottom-0 size-[28%] min-h-2.5 min-w-2.5 rounded-full border-2 border-ink-950 ${
            online ? 'bg-emerald-500' : 'bg-slate-500'
          }`}
        />
      )}
    </span>
  );
}
