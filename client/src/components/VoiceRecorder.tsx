import { useEffect, useRef, useState } from 'react';

const MAX_SECONDS = 120;

interface Props {
  onSend: (file: File) => void;
  onError: (message: string) => void;
  /** Called with true while recording, so the input bar can make room. */
  onRecordingChange: (recording: boolean) => void;
}

function pickMimeType(): string {
  // Chrome/Firefox record Opus in WebM; Safari only supports MP4/AAC.
  return ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'].find((t) => MediaRecorder.isTypeSupported(t)) ?? '';
}

const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

export default function VoiceRecorder({ onSend, onError, onRecordingChange }: Props) {
  const [seconds, setSeconds] = useState<number | null>(null); // null = not recording
  const recorder = useRef<MediaRecorder | null>(null);
  const discard = useRef(false);

  async function start() {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      onError('Voice messages are not supported in this browser');
      return;
    }
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      onError('Microphone access was denied');
      return;
    }

    const mimeType = pickMimeType();
    const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    const chunks: Blob[] = [];
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    rec.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      recorder.current = null;
      setSeconds(null);
      onRecordingChange(false);
      if (discard.current || chunks.length === 0) return;
      const type = rec.mimeType.split(';')[0] || 'audio/webm';
      onSend(new File(chunks, `voice-${Date.now()}.${type.includes('mp4') ? 'm4a' : 'webm'}`, { type }));
    };

    discard.current = false;
    recorder.current = rec;
    rec.start();
    setSeconds(0);
    onRecordingChange(true);
  }

  const stop = (send: boolean) => {
    discard.current = !send;
    recorder.current?.stop();
  };

  // Recording timer; stops automatically at the limit.
  useEffect(() => {
    if (seconds === null) return;
    if (seconds >= MAX_SECONDS) {
      stop(true);
      return;
    }
    const t = setTimeout(() => setSeconds(seconds + 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  // Release the microphone if the component goes away mid-recording.
  useEffect(() => () => stop(false), []);

  if (seconds === null) {
    return (
      <button type="button" onClick={start} className="flex size-10 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-white/5 hover:text-violet-300" aria-label="Record voice message">
        <svg className="size-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-14 0m7 7v4m-4 0h8m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
      </button>
    );
  }

  return (
    <div className="flex min-w-0 flex-1 items-center gap-2">
      <button type="button" onClick={() => stop(false)} className="flex size-10 shrink-0 items-center justify-center rounded-xl text-red-400 hover:bg-red-500/10" aria-label="Discard recording">
        <svg className="size-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3M4 7h16" /></svg>
      </button>
      <div className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2">
        <span className="size-2.5 shrink-0 animate-pulse rounded-full bg-red-500" />
        <span className="font-mono text-sm text-red-300 tabular-nums">{formatTime(seconds)}</span>
        <span className="flex h-5 flex-1 items-center gap-0.5 overflow-hidden" aria-hidden>
          {Array.from({ length: 24 }, (_, i) => (
            <span key={i} className="h-full w-0.5 shrink-0 animate-wave rounded-full bg-red-400/70" style={{ animationDelay: `${(i % 6) * 0.1}s` }} />
          ))}
        </span>
      </div>
      <button type="button" onClick={() => stop(true)} className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white hover:bg-violet-500" aria-label="Send voice message">
        <svg className="size-5" fill="currentColor" viewBox="0 0 24 24"><path d="M3.4 20.4l17.45-7.48a1 1 0 000-1.84L3.4 3.6a1 1 0 00-1.39.92L2 9.12c0 .5.37.93.87.99L17 12 2.87 13.88c-.5.07-.87.5-.87 1l.01 4.6a1 1 0 001.39.92z" /></svg>
      </button>
    </div>
  );
}
