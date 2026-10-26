export default function Spinner({ className = 'size-5' }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={`inline-block animate-spin rounded-full border-2 border-violet-500 border-t-transparent ${className}`}
    />
  );
}
