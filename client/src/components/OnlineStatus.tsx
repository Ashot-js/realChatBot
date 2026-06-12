interface Props {
  isOnline: boolean;
}

export default function OnlineStatus({ isOnline }: Props) {
  if (!isOnline) return null;

  return <span className="online-dot" title="Online" />;
}
