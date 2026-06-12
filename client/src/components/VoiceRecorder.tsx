import { useState, useRef, useCallback } from 'react';

interface Props {
  onSend: (blob: Blob) => void;
}

export default function VoiceRecorder({ onSend }: Props) {
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [cancelling, setCancelling] = useState(false);

  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const startY = useRef<number>(0);
  const touchMoved = useRef(false);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm',
      });

      chunks.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.current.push(e.data);
      };

      recorder.onstop = () => {
        // Stop all tracks
        stream.getTracks().forEach((t) => t.stop());

        if (!cancelling) {
          const blob = new Blob(chunks.current, { type: recorder.mimeType });
          if (blob.size > 0) {
            onSend(blob);
          }
        }
        setCancelling(false);
        setRecording(false);
        setElapsed(0);
        if (timerRef.current) clearInterval(timerRef.current);
      };

      recorder.start();
      mediaRecorder.current = recorder;
      setRecording(true);
      setElapsed(0);
      touchMoved.current = false;

      timerRef.current = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Microphone access denied:', err);
    }
  }, [cancelling, onSend]);

  const stopRecording = useCallback(() => {
    if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
      mediaRecorder.current.stop();
    }
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const cancelRecording = useCallback(() => {
    setCancelling(true);
    stopRecording();
  }, [stopRecording]);

  // Touch / pointer handling for swipe-to-cancel
  function handlePointerDown(e: React.PointerEvent) {
    startY.current = e.clientY;
    touchMoved.current = false;
  }

  function handlePointerMove(e: React.PointerEvent) {
    const deltaY = startY.current - e.clientY;
    setCancelling(deltaY > 50);
    if (Math.abs(deltaY) > 10) touchMoved.current = true;
  }

  function handlePointerUp() {
    if (touchMoved.current) {
      if (cancelling) {
        cancelRecording();
      } else {
        stopRecording();
      }
    } else {
      stopRecording();
    }
  }

  function formatTime(sec: number): string {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  if (recording) {
    return (
      <div className="flex items-center gap-2">
        {/* Cancel zone hint */}
        <div className={`voice-cancel-zone ${cancelling ? 'active' : ''}`}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </div>

        {/* Recording bar */}
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2 flex-1">
          {/* Pulsing dot */}
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse-dot shrink-0" />

          {/* Timer */}
          <span className="text-red-400 text-sm font-mono tabular-nums min-w-[3ch]">
            {formatTime(elapsed)}
          </span>

          {/* Waveform animation */}
          <div className="flex items-center gap-0.5 flex-1 justify-center h-6">
            {Array.from({ length: 16 }).map((_, i) => (
              <div
                key={i}
                className="w-0.5 rounded-full bg-red-400 animate-wave"
                style={{
                  animationDelay: `${i * 0.08}s`,
                  height: `${8 + Math.sin(i * 0.7 + elapsed * 0.5) * 10}px`,
                }}
              />
            ))}
          </div>

          {/* Stop / Send button */}
          <button
            type="button"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className="voice-recorder-btn recording shrink-0"
            title="Release to send, swipe up to cancel"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={startRecording}
      className="voice-recorder-btn p-1.5"
      title="Record voice message"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
        />
      </svg>
    </button>
  );
}
