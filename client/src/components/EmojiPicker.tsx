import { useEffect, useRef } from 'react';

const EMOJI = [
  '😀', '😂', '🤣', '😊', '😍', '🥰', '😘', '😜',
  '😎', '🤩', '🥳', '😇', '🤗', '🤔', '🙄', '😏',
  '😴', '😌', '😢', '😭', '😤', '😡', '🤯', '😱',
  '🥵', '🥶', '😳', '🤡', '👻', '💀', '🤖', '💩',
  '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍',
  '👍', '👎', '👏', '🙌', '🤝', '💪', '✌️', '🤞',
  '👌', '🙏', '🔥', '✨', '🎉', '💯', '✅', '❌',
];

export default function EmojiPicker({ onSelect, onClose }: { onSelect: (emoji: string) => void; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onPointer = (e: PointerEvent) => ref.current && !ref.current.contains(e.target as Node) && onClose();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return (
    <div ref={ref} className="grid w-72 max-w-[calc(100vw-1.5rem)] animate-fade-in grid-cols-8 gap-0.5 rounded-2xl border border-line bg-surface p-2 shadow-2xl">
      {EMOJI.map((emoji) => (
        <button key={emoji} type="button" onClick={() => onSelect(emoji)} className="aspect-square rounded-lg text-xl hover:bg-surface-2" aria-label={emoji}>
          {emoji}
        </button>
      ))}
    </div>
  );
}
