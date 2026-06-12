interface Props {
  usernames: string[];
}

export default function TypingIndicator({ usernames }: Props) {
  if (usernames.length === 0) return null;

  let text: string;
  if (usernames.length === 1) {
    text = `${usernames[0]} is typing`;
  } else if (usernames.length === 2) {
    text = `${usernames[0]} and ${usernames[1]} are typing`;
  } else {
    text = `${usernames.length} people are typing`;
  }

  return (
    <div className="flex items-center gap-2 text-xs text-slate-400">
      <div className="flex gap-1">
        <span className="typing-dot" />
        <span className="typing-dot" />
        <span className="typing-dot" />
      </div>
      <span>{text}</span>
    </div>
  );
}
