import { useEffect, useRef } from 'react';

interface Props {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

const EMOJI_LIST = [
  '😀', '😂', '🤣', '😍', '🥰', '😘', '😜', '🤪',
  '😎', '🤩', '🥳', '😇', '🤗', '🤔', '😐', '😑',
  '😶', '🙄', '😏', '😣', '😥', '😮', '🤐', '😯',
  '😪', '😫', '😴', '😌', '😛', '😝', '🤤', '😒',
  '😓', '😔', '😕', '🙃', '🤑', '😲', '☹️', '🙁',
  '😖', '😞', '😟', '😤', '😢', '😭', '😦', '😧',
  '😨', '😩', '🤯', '😬', '😰', '😱', '🥵', '🥶',
  '😳', '🤬', '😡', '😠', '😈', '👿', '💀', '☠️',
  '💩', '🤡', '👻', '👽', '🤖', '😺', '😸', '😹',
  '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍',
  '👍', '👎', '👏', '🙌', '🤝', '💪', '✌️', '🤞',
  '🤟', '🤘', '👌', '🤌', '🙏', '✍️', '💅', '🤳',
];

export default function EmojiPicker({ onSelect, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="bg-navy-800 border border-navy-700 rounded-xl p-3 w-64 shadow-xl"
    >
      <div className="grid grid-cols-8 gap-1">
        {EMOJI_LIST.map((emoji, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onSelect(emoji)}
            className="text-lg hover:bg-navy-700 rounded p-1 transition-colors"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
